from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
import os

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/hazardwatch")
_parsed_uri = urlparse(MONGO_URI)
# Spark's Windows launcher treats ampersands in submit-time config values as command separators.
SPARK_MONGO_URI = MONGO_URI.split("?", 1)[0]
DB_NAME = os.getenv("MONGO_DB_NAME") or os.getenv("DB_NAME") or _parsed_uri.path.lstrip("/") or "hazardwatch"
REPORTS_COLLECTION = os.getenv("REPORTS_COLLECTION", "reports")

EXPECTED_COLUMNS = [
    "_id", "title", "description", "category", "customCategory",
    "location", "barangay", "priority", "status", "images",
    "reportedBy", "comments", "views",
    "isActive", "archived", "createdAt", "updatedAt",
]

ANALYTICS_COLLECTIONS = {
    "reports_per_barangay": "analytics_reports_per_barangay",
    "reports_per_category": "analytics_reports_per_category",
    "reports_per_priority": "analytics_reports_per_priority",
    "reports_per_status": "analytics_reports_per_status",
    "reports_per_day": "analytics_reports_per_day",
    "tumbling_hourly": "analytics_tumbling_hourly",
    "tumbling_daily": "analytics_tumbling_daily",
    "sliding_1h_10m": "analytics_sliding_1h_10m",
    "session_30m": "analytics_session_30m",
}
