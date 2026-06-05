from threading import Thread
from runtime_state import exam_running
from worker import run_exam_worker
running_threads = {}


def start_exam_worker(exam_id, hall_id):
    session = (exam_id, hall_id)

    if session in running_threads:
        print("[CONTROLLER] Already running")
        return

    thread = Thread(
        target=run_exam_worker,
        args=(exam_id, hall_id),
        daemon=True
    )

    running_threads[session] = thread
    exam_running[session] = True

    thread.start()


def stop_exam_worker(exam_id, hall_id):
    session = (exam_id, hall_id)

    exam_running[session] = False
    running_threads.pop(session, None)


def is_running(exam_id, hall_id):
    return (exam_id, hall_id) in running_threads