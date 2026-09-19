import logging
import sys
from pathlib import Path

from pyspark.sql.functions import col, date_format, to_timestamp

SPARK_ROOT = Path(__file__).resolve().parents[1]
if str(SPARK_ROOT) not in sys.path:
    sys.path.insert(0, str(SPARK_ROOT))

from utils.mongo_config import ANALYTICS_COLLECTIONS, DB_NAME, EXPECTED_COLUMNS, MONGO_URI, REPORTS_COLLECTION
from utils.spark_session import get_spark_session

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("hazardwatch.batch")


def read_reports(spark):
    logger.info("Reading MongoDB collection %s.%s", DB_NAME, REPORTS_COLLECTION)
    reports = (
        spark.read.format("mongodb")
        .option("connection.uri", MONGO_URI)
        .option("database", DB_NAME)
        .option("collection", REPORTS_COLLECTION)
        .load()
    )
    logger.info("Reports columns: %s", reports.columns)
    missing_columns = [column for column in EXPECTED_COLUMNS if column not in reports.columns]
    if missing_columns:
        logger.warning("Reports schema is missing expected columns: %s", missing_columns)
    return reports.filter((col("isActive") == True) & (col("archived").isNull() | (col("archived") != True)))


def write_result(dataframe, collection):
    logger.info("Writing analytics collection %s", collection)
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
        reports = read_reports(spark).withColumn("reportTimestamp", to_timestamp(col("createdAt")))
        aggregations = {
            "reports_per_barangay": reports.groupBy("barangay").count().orderBy(col("count").desc()),
            "reports_per_category": reports.groupBy("category").count().orderBy(col("count").desc()),
            "reports_per_priority": reports.groupBy("priority").count().orderBy(col("count").desc()),
            "reports_per_status": reports.groupBy("status").count().orderBy(col("count").desc()),
            "reports_per_day": reports.groupBy(date_format("reportTimestamp", "yyyy-MM-dd").alias("date")).count().orderBy("date"),
        }
        for name, result in aggregations.items():
            write_result(result, ANALYTICS_COLLECTIONS[name])
        logger.info("Batch analytics completed")
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
