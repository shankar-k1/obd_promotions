import time
import os
from typing import Optional

from .database_module import DatabaseModule
from .scrubbing_engine import ScrubbingEngine
from .cache_engine import cache_engine
from .logging_system import logger
from .email_module import EmailModule


def _pop_next_job_id() -> Optional[int]:
    """
    Pops the next job id from the lightweight queue.
    Prefer Redis list semantics when available via CacheEngine,
    but fall back to an in-memory list stored in cache.
    """
    queue_key = "scrub_jobs_queue"
    lock_key = "scrub_jobs_lock"
    # Wait for the lock to ensure only ONE worker pops at a time
    with cache_engine.lock(lock_key, expire=10):
        try:
            queue = cache_engine.get(queue_key) or []
            if not queue:
                return None
            job_id = queue.pop(0)
            cache_engine.set(queue_key, queue, expire=None)
            return int(job_id)
        except Exception as e:
            print(f"ScrubWorker Queue Error: {e}")
            return None


def process_job(job_id: int):
    """
    Processes a single scrub job:
    - Loads MSISDN inputs in chunks
    - Runs ScrubbingEngine.perform_full_scrub
    - Persists results via DatabaseModule.save_verified_scrub_results
    - Updates job status and metrics
    """
    db = DatabaseModule()
    engine = ScrubbingEngine()

    job = db.get_scrub_job(job_id)
    if not job:
        logger.log("backend", "error", f"Scrub job {job_id} not found", "scrub_worker")
        return

    logger.log("backend", "info", f"Starting scrub job {job_id}", "scrub_worker")
    db.update_scrub_job_status(job_id, status="RUNNING", mark_started=True)

    try:
        operator_name = job.get("operator")
        import json
        options = json.loads(job.get("options_json") or "{}")

        # 1. RUN TURBO SQL SCRUB (Process million records in < 1s)
        sql_metrics = db.perform_job_scrub_sql(job_id, options, operator_name)
        
        # 2. INSTANT PERSISTENCE (Server-side copy, no loops)
        save_ok, table_name = db.save_verified_scrub_job_results(job_id)
        if not save_ok:
            raise RuntimeError(f"Failed to save scrub results: {table_name}")

        # 3. Load survivors only for email/logging (deferred)
        final_base = []
        for chunk in db.load_scrub_job_inputs(job_id):
            final_base.extend(chunk)

        db.update_scrub_job_status(
            job_id,
            status="COMPLETED",
            final_count=sql_metrics["final"],
            results_table=table_name,
            dnd_removed=sql_metrics["dnd"],
            sub_removed=sql_metrics["sub"],
            unsub_removed=sql_metrics["unsub"],
            operator_removed=sql_metrics["operator"],
        )
        
        # Format a report for email (compatibility with EmailModule)
        report = {
            "initial_count": job.get("total_input", 0),
            "dnd_removed": sql_metrics["dnd"],
            "sub_removed": sql_metrics["sub"],
            "unsub_removed": sql_metrics["unsub"],
            "operator_removed": sql_metrics["operator"],
            "stages": [{"count": sql_metrics["final"]}]
        }

        # TRIGGER EMAIL REPORT
        try:
            email_agent = EmailModule()
            email_ok, email_msg = email_agent.send_scrub_report(report, msisdns=final_base)
            if email_ok:
                logger.log("backend", "success", f"Email report sent for job {job_id}", "scrub_worker")
            else:
                logger.log("backend", "error", f"Email report failed for job {job_id}: {email_msg}", "scrub_worker")
        except Exception as email_err:
            logger.log("backend", "error", f"Email trigger error for job {job_id}: {email_err}", "scrub_worker")

        # Automatically log to scrub history for the dashboard
        try:
            db.log_scrub_history({
                "total_input": job.get("total_input", 0),
                "final_count": len(final_base),
                "dnd_removed": report.get("dnd_removed", 0),
                "sub_removed": report.get("sub_removed", 0),
                "unsub_removed": report.get("unsub_removed", 0),
                "operator_removed": report.get("operator_removed", 0),
                "results_table": table_name,
                "msisdn_list": [] # Statistics already saved in results_table
            })
        except Exception as log_err:
            logger.log("backend", "error", f"Failed to auto-log history for job {job_id}: {log_err}", "scrub_worker")

        logger.log(
            "backend",
            "success",
            f"Scrub job {job_id} completed. Final count: {len(final_base)} (table: {table_name})",
            "scrub_worker",
        )
    except Exception as e:
        err_msg = str(e)
        logger.log(
            "backend",
            "error",
            f"Scrub job {job_id} failed: {err_msg}",
            "scrub_worker",
        )
        db.update_scrub_job_status(
            job_id,
            status="FAILED",
            error_message=err_msg,
        )


def run_forever(poll_interval: int = 5):
    """
    Long-running worker loop.
    Intended to be started as a separate process:

        python -m modules.scrub_worker
    """
    logger.log("backend", "info", "Scrub worker started", "scrub_worker")
    while True:
        job_id = _pop_next_job_id()
        if job_id is None:
            time.sleep(poll_interval)
            continue
        process_job(job_id)


if __name__ == "__main__":
    interval = int(os.getenv("SCRUB_WORKER_POLL_INTERVAL", "5"))
    run_forever(poll_interval=interval)

