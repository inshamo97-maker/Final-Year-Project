from threading import Thread
from main import run_exam_worker

running_threads = {}


def start_exam_worker(exam_id, hall_id):
    print(f"[CONTROLLER] Starting worker exam_id={exam_id}")

    thread = Thread(
        target=run_exam_worker,
        args=(exam_id, hall_id),
        daemon=True
    )

    running_threads[exam_id] = thread
    thread.start()

    return True


def stop_exam_worker(exam_id):
    print(f"[CONTROLLER] Stop requested exam_id={exam_id}")

    # graceful stop later (event flag system)
    running_threads.pop(exam_id, None)

    return True


def is_exam_running(exam_id):
    return exam_id in running_threads