import time
from datetime import datetime, timedelta
from db import DB
from exam_controller import start_exam_worker, stop_exam_worker
from main import run_exam_worker
from speaker_alert import trigger_alert
from locks import db_lock
from threading import Thread
from whisper_detector import stop_whisper_detection
from runtime_state import exam_running
running_threads = {}
pre_alert_sent = set()
start_alert_sent = set()
def stop_exam_runtime(exam_id, hall_id):
    session_key = (exam_id, hall_id)
    exam_running[session_key] = False
    print(f"[RUNTIME] Stopped exam {session_key}")

def get_pending_exams():
    conn = DB.get_connection()
    cur = conn.cursor()

    with db_lock:cur.execute("""
        SELECT id, date, start_time, hall_id, end_time
        FROM exams
        WHERE status = 'scheduled'
    """)

    exams = cur.fetchall()
    cur.close()
    return exams


def get_running_exams():
    conn = DB.get_connection()
    cur = conn.cursor()

    with db_lock:cur.execute("""
        SELECT id, date, start_time, hall_id, end_time
        FROM exams
        WHERE status = 'running'
    """)

    exams = cur.fetchall()
    cur.close()
    return exams


def mark_running(exam_id):
    conn = DB.get_connection()
    cur = conn.cursor()

    with db_lock:cur.execute("""
        UPDATE exams
        SET status = 'running'
        WHERE id = %s
    """, (exam_id,))

    conn.commit()
    cur.close()


def mark_completed(exam_id):
    conn = DB.get_connection()
    cur = conn.cursor()

    with db_lock:cur.execute("""
        UPDATE exams
        SET status = 'completed'
        WHERE id = %s
    """, (exam_id,))

    conn.commit()
    cur.close()





def scheduler_loop():
    print("Scheduler started...")

    while True:
        try:
            now = datetime.now()

            exams = get_pending_exams()

            for exam_id, exam_date, start_time, hall_id, end_time in exams:

                exam_datetime = datetime.combine(exam_date, start_time)
                buffer_time = exam_datetime - timedelta(minutes=5)
                warning_time = exam_datetime - timedelta(minutes=1)

                # -------------------------
                # PHASE 1: 5 min before
                # -------------------------
                if buffer_time <= now < warning_time:
                    if exam_id not in pre_alert_sent:
                        trigger_alert(
                            roll_number="SYSTEM",
                            reason="Attendance and seating verification will start in one minute. Please proceed to your seats.",
                            exam_id=str(exam_id)
                        )
                        pre_alert_sent.add(exam_id)

                # -------------------------
                # PHASE 2: START
                # -------------------------
                if now >= exam_datetime:
                    if exam_id not in start_alert_sent:

                        trigger_alert(
                            roll_number="SYSTEM",
                            reason="Attendance and seating verification has started.",
                            exam_id=str(exam_id)
                        )

                        print(f"[SCHEDULER] Starting exam {exam_id}")

                        mark_running(exam_id)
                        start_exam_worker(exam_id, hall_id)

                        start_alert_sent.add(exam_id)

            # -------------------------
            # STOP EXAMS
            # -------------------------
            running_exams = get_running_exams()

            for exam_id, exam_date, start_time, hall_id, end_time in running_exams:

                end_datetime = datetime.combine(exam_date, end_time)

                if now > end_datetime:
                    print(f"[SCHEDULER] Ending exam {exam_id}")
                    stop_whisper_detection(hall_id, exam_id)
                    stop_exam_runtime(exam_id, hall_id)
                    stop_exam_worker(exam_id)
                    mark_completed(exam_id)

            time.sleep(5)

        except Exception as e:
            print("[ERROR] Scheduler:", e)
            time.sleep(5)


if __name__ == "__main__":
    scheduler_loop()