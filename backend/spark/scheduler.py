import logging
import subprocess
import sys
import time
from pathlib import Path

import schedule

ROOT = Path(__file__).resolve().parent
BATCH_JOB = ROOT / "jobs" / "batch_analytics.py"
WINDOW_JOB = ROOT / "jobs" / "window_analytics.py"
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("hazardwatch.scheduler")


def run_job(job_name, job_path):
    try:
        logger.info("Starting scheduled %s job", job_name)
        result = subprocess.run([sys.executable, str(job_path)], cwd=ROOT.parent.parent, check=False)
        if result.returncode:
            logger.error("Scheduled %s job failed with status %s", job_name, result.returncode)
        else:
            logger.info("Scheduled %s job completed successfully", job_name)
    except Exception:
        logger.exception("Scheduled %s job raised an exception; scheduler will continue", job_name)


def run_batch():
    run_job("batch analytics", BATCH_JOB)


def run_windows():
    run_job("window analytics", WINDOW_JOB)


if __name__ == "__main__":
    try:
        run_batch()
        schedule.every().hour.do(run_batch)
        schedule.every().day.at("00:00").do(run_windows)
        logger.info("Scheduler started: batch hourly, window daily at 00:00")
        while True:
            schedule.run_pending()
            time.sleep(30)
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user")
    except Exception:
        logger.exception("Scheduler stopped unexpectedly")
