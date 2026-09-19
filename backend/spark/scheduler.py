import logging
import subprocess
import sys
import time
from pathlib import Path

import schedule

ROOT = Path(__file__).resolve().parent
BATCH_JOB = ROOT / "jobs" / "batch_analytics.py"
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("hazardwatch.scheduler")


def run_batch():
    logger.info("Starting scheduled batch analytics job")
    result = subprocess.run([sys.executable, str(BATCH_JOB)], cwd=ROOT.parent.parent, check=False)
    if result.returncode:
        logger.error("Batch analytics exited with status %s", result.returncode)
    else:
        logger.info("Scheduled batch analytics completed")


if __name__ == "__main__":
    run_batch()
    schedule.every().hour.do(run_batch)
    logger.info("Scheduler started; batch analytics will run every hour")
    while True:
        schedule.run_pending()
        time.sleep(30)
