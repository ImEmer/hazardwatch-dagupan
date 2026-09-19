from pyspark.sql import SparkSession

from .mongo_config import SPARK_MONGO_URI

CONNECTOR = "org.mongodb.spark:mongo-spark-connector_2.13:11.1.0"


def get_spark_session():
    return (
        SparkSession.builder
        .appName("HazardWatch Analytics")
        .master("local[*]")
        .config("spark.hadoop.fs.permissions.enabled", "false")
        .config("spark.mongodb.input.uri", SPARK_MONGO_URI)
        .config("spark.mongodb.output.uri", SPARK_MONGO_URI)
        .config("spark.jars.packages", CONNECTOR)
        .getOrCreate()
    )
