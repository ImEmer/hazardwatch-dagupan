import argparse
import logging
import sys
from pathlib import Path

from pymongo import MongoClient
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_timestamp, window
from pyspark.sql.types import BooleanType, StringType, StructField, StructType, TimestampType

SPARK_ROOT = Path(__file__).resolve().parents[1]
if str(SPARK_ROOT) not in sys.path:
    sys.path.insert(0, str(SPARK_ROOT))

from utils.mongo_config import DB_NAME, MONGO_URI

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
        stream.withWatermark("createdAt", "5 minutes")
        .groupBy(window("createdAt", "5 minutes"), col(dimension))
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


def main(source_dir):
    source_dir = Path(source_dir).resolve()
    source_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_root = SPARK_ROOT / "checkpoints"
    checkpoint_root.mkdir(exist_ok=True)
    spark = (
        SparkSession.builder.appName("HazardWatch Streaming Analytics")
        .master("local[*]")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")
    stream = (
        spark.readStream.schema(SCHEMA).option("maxFilesPerTrigger", 1)
        .json(str(source_dir))
        .withColumn("createdAt", to_timestamp(col("createdAt")))
        .filter((col("isActive") == True) & (col("archived").isNull() | (col("archived") != True)))
        .filter(col("createdAt").isNotNull())
    )
    queries = [
        build_query(stream, "barangay", "streaming_reports_per_barangay", checkpoint_root / "barangay"),
        build_query(stream, "category", "streaming_reports_per_category", checkpoint_root / "category"),
        build_query(stream, "priority", "streaming_reports_per_priority", checkpoint_root / "priority"),
    ]
    logger.info("Streaming analytics started; add newline-delimited JSON files to %s", source_dir)
    try:
        spark.streams.awaitAnyTermination()
    finally:
        for query in queries:
            query.stop()
        spark.stop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run local Structured Streaming analytics")
    parser.add_argument("--source", default=str(SPARK_ROOT / "stream_input"), help="Directory containing newline-delimited JSON report events")
    main(parser.parse_args().source)
