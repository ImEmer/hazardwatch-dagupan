# HazardWatch Spark Analytics

PySpark runs in local mode and reads the existing MongoDB `reports` collection. Batch and window jobs write results to MongoDB analytics collections. The streaming job uses a directory of newline-delimited JSON events because this is portable on Windows and does not require a MongoDB change-stream source connector.

The SparkSession uses MongoDB Spark Connector `org.mongodb.spark:mongo-spark-connector_2.13:11.1.0`, which matches PySpark 4.x and Scala 2.13.

## Setup

From the repository root:

```powershell
python -m pip install -r backend/spark/requirements.txt
```

The jobs load `backend/.env`. `MONGO_URI` is required by the backend and is used by Spark; `MONGO_DB_NAME` or `DB_NAME` can override the database parsed from the URI.

On Windows, Spark may require Hadoop's `winutils.exe`. If the permissions workaround does not start Spark on a particular installation, set `HADOOP_HOME` to a Hadoop tools directory containing `bin/winutils.exe` before running a job.

## Jobs

```powershell
python backend/spark/jobs/batch_analytics.py
python backend/spark/jobs/window_analytics.py
python backend/spark/scheduler.py
```

The scheduler runs the batch job once at startup and then every hour. For Windows Task Scheduler, create a task that starts `python` with `backend/spark/scheduler.py`, sets the working directory to the repository root, and runs whether the user is logged on or not.

Run streaming analytics with:

```powershell
python backend/spark/jobs/streaming_analytics.py --source backend/spark/stream_input
```

Add a new `.json` file containing one or more newline-delimited events:

```json
{"barangay":"Bacayao Norte","category":"Flooding","priority":"High","createdAt":"2026-09-19T10:00:00Z","isActive":true,"archived":false}
```

The stream applies a five-minute watermark, five-minute processing windows, and checkpoint directories under `backend/spark/checkpoints`. Stop it with `Ctrl+C`.

## Successful local runs

- Batch analytics completed and created five collections: barangay, category, priority, status, and daily trend results.
- Window analytics completed and created four collections: tumbling hourly, tumbling daily, sliding, and session results.
- Streaming analytics starts successfully and waits for new report events in `backend/spark/stream_input/`.

The temporary-directory warning that can appear on Windows is non-critical for local Spark execution. Adaptive Query Execution (AQE) warnings are also normal for Structured Streaming. A `KeyboardInterrupt` after pressing `Ctrl+C` to stop the streaming job is expected during shutdown.

## Output collections

Batch: `analytics_reports_per_barangay`, `analytics_reports_per_category`, `analytics_reports_per_priority`, `analytics_reports_per_status`, and `analytics_reports_per_day`.

Windows: `analytics_tumbling_hourly`, `analytics_tumbling_daily`, `analytics_sliding_1h_10m`, and `analytics_session_30m`.

Streaming: `streaming_reports_per_barangay`, `streaming_reports_per_category`, and `streaming_reports_per_priority`.

The Express API exposes the batch/window collections under `/api/analytics/*` for authenticated staff users.
