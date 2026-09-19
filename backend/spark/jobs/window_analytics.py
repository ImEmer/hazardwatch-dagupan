import logging
import sys
from pathlib import Path

from pyspark.sql.functions import col, session_window, to_timestamp, window

SPARK_ROOT = Path(__file__).resolve().parents[1]
if str(SPARK_ROOT) not in sys.path:
    sys.path.insert(0, str(SPARK_ROOT))

from utils.mongo_config import ANALYTICS_COLLECTIONS, DB_NAME, MONGO_URI, REPORTS_COLLECTION
from utils.spark_session import get_spark_session

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("hazardwatch.windows")


def read_reports(spark):
    logger.info("Reading MongoDB collection %s.%s", DB_NAME, REPORTS_COLLECTION)
    return (
        spark.read.format("mongodb")
        .option("connection.uri", MONGO_URI)
        .option("database", DB_NAME)
        .option("collection", REPORTS_COLLECTION)
        .load()
        .filter((col("isActive") == True) & (col("archived").isNull() | (col("archived") != True)))
        .withColumn("createdAt", to_timestamp(col("createdAt")))
        .filter(col("createdAt").isNotNull())
    )


def write_result(dataframe, collection):
    logger.info("Writing window collection %s", collection)
    (
        dataframe.write.format("mongodb")
        .mode("overwrite")
        .option("connection.uri", MONGO_URI)
        .option("database", DB_NAME)
        .option("collection", collection)
        .save()
    )


def main():
    spark = get_spark_session()
    spark.sparkContext.setLogLevel("WARN")
    try:
        reports = read_reports(spark)
        logger.info("Computing tumbling hourly and daily windows")
        hourly = reports.groupBy(window("createdAt", "1 hour").alias("window")).count()
        daily = reports.groupBy(window("createdAt", "1 day").alias("window")).count()
        logger.info("Computing sliding 1-hour windows with a 10-minute slide")
        sliding = reports.groupBy(window("createdAt", "1 hour", "10 minutes").alias("window")).count()
        logger.info("Computing 30-minute session windows by reporter")
        reporter = col("reportedBy.userId").cast("string").alias("reporterId")
        sessions = reports.groupBy(reporter, session_window("createdAt", "30 minutes").alias("window")).count()

        write_result(hourly, ANALYTICS_COLLECTIONS["tumbling_hourly"])
        write_result(daily, ANALYTICS_COLLECTIONS["tumbling_daily"])
        write_result(sliding, ANALYTICS_COLLECTIONS["sliding_1h_10m"])
        write_result(sessions, ANALYTICS_COLLECTIONS["session_30m"])
        logger.info("Window analytics completed")
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
