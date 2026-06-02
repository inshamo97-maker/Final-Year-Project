import time
import subprocess

from db import DB
import sys
from datetime import datetime, timedelta
running_processes = {}


def get_pending_exams():
    conn = DB.get_connection()
    cur = conn.cursor()

    cur.execute("""
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

    cur.execute("""
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

    cur.execute("""
        UPDATE exams
        SET status = 'running'
        WHERE id = %s
    """, (exam_id,))

    conn.commit()
    cur.close()


def mark_completed(exam_id):
    conn = DB.get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE exams
        SET status = 'completed'
        WHERE id = %s
    """, (exam_id,))

    conn.commit()
    cur.close()


def run_exam(exam_id, hall_id):
    print(f"[START] Exam AI started | exam_id={exam_id}")

    proc = subprocess.Popen([
        sys.executable,
        "main.py",
        str(exam_id),
        str(hall_id)
    ])

    running_processes[exam_id] = proc


def stop_exam(exam_id):
    proc = running_processes.get(exam_id)

    if proc:
        print(f"[STOP] Terminating exam AI | exam_id={exam_id}")
        proc.terminate()
        running_processes.pop(exam_id, None)


def scheduler_loop():
    print("Scheduler started...")

    while True:
        try:
            now = datetime.now()

            # ----------------------------
            # START EXAMS
            # ----------------------------
            exams = get_pending_exams()

            for exam_id, exam_date, start_time, hall_id, end_time in exams:

                if exam_id in running_processes:
                    continue

                exam_datetime = datetime.combine(exam_date, start_time)
                buffer_time = exam_datetime - timedelta(minutes=5)

                if now >= buffer_time and now <= exam_datetime:

                    print(f"[SCHEDULER] Starting exam {exam_id}")

                    mark_running(exam_id)
                    run_exam(exam_id, hall_id)

            # ----------------------------
            # STOP EXAMS (DB CONTROLLED)
            # ----------------------------
            running_exams = get_running_exams()

            for exam_id, exam_date, start_time, hall_id, end_time in running_exams:

                end_datetime = datetime.combine(exam_date, end_time)

                if now > end_datetime:

                    print(f"[SCHEDULER] Ending exam {exam_id}")

                    stop_exam(exam_id)
                    mark_completed(exam_id)

            time.sleep(5)

        except Exception as e:
            print("[ERROR] Scheduler:", e)
            time.sleep(5)


if __name__ == "__main__":
    scheduler_loop()