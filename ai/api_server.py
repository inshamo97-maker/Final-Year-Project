from fastapi import FastAPI
from exam_controller import start_exam_worker, stop_exam_worker
from orchestrator import scheduler_loop
from threading import Thread

app = FastAPI()

scheduler_thread = None


@app.on_event("startup")
def start_scheduler():
    global scheduler_thread

    scheduler_thread = Thread(target=scheduler_loop, daemon=True)
    scheduler_thread.start()

    print("[API] Scheduler started")


# -------------------------
# MANUAL CONTROL (IMPORTANT FOR FRONTEND)
# -------------------------

@app.post("/exam/start")
def start_exam(exam_id: int, hall_id: int):

    start_exam_worker(exam_id, hall_id)

    return {
        "status": "started",
        "exam_id": exam_id,
        "hall_id": hall_id
    }


@app.post("/exam/stop")
def stop_exam(exam_id: int):

    stop_exam_worker(exam_id)

    return {
        "status": "stopped",
        "exam_id": exam_id
    }


@app.get("/health")
def health():
    return {"status": "ok"}