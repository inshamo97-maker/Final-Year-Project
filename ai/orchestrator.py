import time
import threading
from datetime import datetime, timedelta

from db import DB
from exam_controller import start_exam_worker, stop_exam_worker
from speaker_alert import trigger_alert
from whisper_detector import stop_whisper_detection
from runtime_state import exam_running

pre_alert_sent = set()
start_alert_sent = set()

scheduler_running = False
scheduler_thread = None


def get_pending_exams():
    conn = DB.get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, date, start_time, hall_id, end_time
        FROM exams
        WHERE status='scheduled'
    """)
    data = cur.fetchall()
    cur.close()
    return data


def get_running_exams():
    conn = DB.get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, date, start_time, hall_id, end_time
        FROM exams
        WHERE status='running'
    """)
    data = cur.fetchall()
    cur.close()
    return data


def resume_running_exams():
    """
    Called once on startup to restart any exams left in 'running' state.
    This handles the case where uvicorn reloaded or the server crashed
    mid-exam, leaving the DB status as 'running' but no worker thread active.
    """
    print("[SCHEDULER] Checking for interrupted running exams...")

    try:
        for exam_id, date, start_time, hall_id, end_time in get_running_exams():
            end_dt = datetime.combine(date, end_time)

            if datetime.now() < end_dt:
                print(f"[SCHEDULER] Resuming exam_id={exam_id} hall_id={hall_id}")
                start_exam_worker(exam_id, hall_id)
            else:
                # Already past end time — mark completed
                print(f"[SCHEDULER] Exam {exam_id} already ended, marking completed")
                cur = DB.get_connection().cursor()
                cur.execute(
                    "UPDATE exams SET status='completed' WHERE id=%s",
                    (exam_id,)
                )
                cur.connection.commit()
                cur.close()

    except Exception as e:
        print(f"[SCHEDULER] Error during resume: {e}")


def scheduler_loop():
    global scheduler_running
    scheduler_running = True

    print("[SCHEDULER] Running...")

    while scheduler_running:
        try:
            now = datetime.now()

            # ================= START =================
            for exam_id, date, start_time, hall_id, end_time in get_pending_exams():

                exam_dt = datetime.combine(date, start_time)
                warn_5 = exam_dt - timedelta(minutes=5)
                warn_1 = exam_dt - timedelta(minutes=1)

                if exam_id not in pre_alert_sent and now >= warn_5:
                    trigger_alert("SYSTEM", "Exam starts in 5 minutes", exam_id=str(exam_id))
                    pre_alert_sent.add(exam_id)

                if exam_id not in start_alert_sent and now >= warn_1:
                    trigger_alert("SYSTEM", "Exam starts in 1 minute", exam_id=str(exam_id))
                    start_alert_sent.add(exam_id)

                if now >= exam_dt and exam_id in start_alert_sent:
                    cur = DB.get_connection().cursor()
                    cur.execute("UPDATE exams SET status='running' WHERE id=%s", (exam_id,))
                    cur.connection.commit()
                    cur.close()

                    start_exam_worker(exam_id, hall_id)

            # ================= STOP =================
            for exam_id, date, start_time, hall_id, end_time in get_running_exams():

                end_dt = datetime.combine(date, end_time)

                if now >= end_dt:
                    stop_whisper_detection(hall_id, exam_id)
                    stop_exam_worker(exam_id, hall_id)

                    cur = DB.get_connection().cursor()
                    cur.execute("UPDATE exams SET status='completed' WHERE id=%s", (exam_id,))
                    cur.connection.commit()
                    cur.close()

            time.sleep(5)

        except Exception as e:
            print("[SCHEDULER ERROR]", e)
            time.sleep(5)


def start_scheduler():
    global scheduler_thread, scheduler_running

    resume_running_exams()  # ← resume any exams interrupted by reload/crash

    scheduler_thread = threading.Thread(target=scheduler_loop, daemon=True)
    scheduler_thread.start()
    return scheduler_thread


def stop_scheduler():
    global scheduler_running
    scheduler_running = False


def scheduler_status():
    return {"running": scheduler_running}