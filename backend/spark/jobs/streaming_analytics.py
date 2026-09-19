import argparse
import logging
import sys
from pathlib import Path

from pymongo import MongoClient
from pyspark.sql.functions import col, to_timestamp, window
from pyspark.sql.types import BooleanType, StringType, StructField, StructType, TimestampType

SPARK_ROOT = Path(__file__).resolve().parents[1]
if str(SPARK_ROOT) not in sys.path:
    sys.path.insert(0, str(SPARK_ROOT))

from utils.mongo_config import DB_NAME, MONGO_URI, REPORTS_COLLECTION
from utils.spark_session import get_spark_session

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("hazardwatch.streaming")

SCHEMA = StructType([
    StructField("barangay", StringType()),
    StructField("category", StringType()),
    StructField("priority", StringType()),
    StructField("createdAt", TimestampType()),
    StructField("isActive", BooleanType()),
    StructField("archived", BooleanType()),
])
CHECKPOINT_ROOT = SPARK_ROOT / "checkpoints" / "streaming"


def active_reports(stream):
    return (
        stream.withColumn("createdAt", to_timestamp(col("createdAt")))
        .filter((col("isActive") == True) & (col("archived").isNull() | (col("archived") != True)))
        .filter(col("createdAt").isNotNull())
    )


def upsert_batch(collection_name, dimension, batch, batch_id):
    client = MongoClient(MONGO_URI)
    try:
        collection = client[DB_NAME][collection_name]
        for row in batch.collect():
            values = row.asDict(recursive=True)
            start = values.pop("windowStart")
            end = values.pop("windowEnd")
            dimension_value = values.pop(dimension)
            collection.update_one(
                {dimension: dimension_value, "windowStart": start, "windowEnd": end},
                {"$set": {dimension: dimension_value, "windowStart": start, "windowEnd": end, "count": values["count"]}},
                upsert=True,
            )
        logger.info("Updated %s from micro-batch %s", collection_name, batch_id)
    finally:
        client.close()


def build_query(stream, dimension, collection_name, checkpoint):
    aggregated = (
        stream.withWatermark("createdAt", "1 minute")
        .groupBy(window("createdAt", "1 minute"), col(dimension))
        .count()
        .select(
            col(dimension),
            col("window.start").alias("windowStart"),
            col("window.end").alias("windowEnd"),
            col("count"),
        )
    )
    return (
        aggregated.writeStream
        .outputMode("update")
        .option("checkpointLocation", str(checkpoint))
        .foreachBatch(lambda batch, batch_id: upsert_batch(collection_name, dimension, batch, batch_id))
        .start()
    )


def start_queries(stream, checkpoint_root):
    return [
        build_query(stream, "barangay", "streaming_reports_per_barangay", checkpoint_root / "barangay"),
        build_query(stream, "category", "streaming_reports_per_category", checkpoint_root / "category"),
        build_query(stream, "priority", "streaming_reports_per_priority", checkpoint_root / "priority"),
    ]


def run_change_stream(spark):
    logger.info("Starting MongoDB Change Stream for %s.%s", DB_NAME, REPORTS_COLLECTION)
    stream = (
        spark.readStream
        .format("mongodb")
        .option("spark.mongodb.read.connection.uri", MONGO_URI)
        .option("spark.mongodb.read.database", DB_NAME)
        .option("spark.mongodb.read.collection", REPORTS_COLLECTION)
        .option("spark.mongodb.change.stream.publish.full.document.only", "true")
        .load()
    )
    start_queries(active_reports(stream), CHECKPOINT_ROOT)
    logger.info("MongoDB Change Stream analytics started")
    spark.streams.awaitAnyTermination()


def run_file_fallback(spark, source_dir):
    logger.warning("Falling back to JSON streaming source at %s", source_dir)
    source_dir.mkdir(parents=True, exist_ok=True)
    stream = (
        spark.readStream.schema(SCHEMA)
        .option("maxFilesPerTrigger", 1)
        .json(str(source_dir))
    )
    start_queries(active_reports(stream), CHECKPOINT_ROOT / "file-fallback")
    logger.info("File fallback streaming analytics started")
    spark.streams.awaitAnyTermination()


def main(source_dir=None):
    source_dir = Path(source_dir or SPARK_ROOT / "stream_input").resolve()
    CHECKPOINT_ROOT.mkdir(parents=True, exist_ok=True)
    spark = get_spark_session()
    spark.sparkContext.setLogLevel("WARN")
    try:
        for attempt in range(2):
            try:
                run_change_stream(spark)
                break
            except Exception as error:
                logger.exception("MongoDB Change Stream attempt %s failed: %s", attempt + 1, error)
                for query in spark.streams.active:
                    query.stop()
                if attempt == 0:
                    logger.info("Retrying MongoDB Change Stream once")
                else:
                    run_file_fallback(spark, source_dir)
                    break
    except KeyboardInterrupt:
        logger.info("Streaming analytics stopped by user")
    finally:
        for query in spark.streams.active:
            query.stop()
        spark.stop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run MongoDB Change Stream analytics with JSON fallback")
    parser.add_argument("--source", default=str(SPARK_ROOT / "stream_input"), help="Directory used by the JSON fallback source")
    main(parser.parse_args().source)
