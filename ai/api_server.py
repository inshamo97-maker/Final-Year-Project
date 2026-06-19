
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import cv2
import time
from frame_broadcaster import get_frame
from orchestrator import start_scheduler, stop_scheduler, scheduler_status

import socketio

app = FastAPI()

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# SOCKET.IO
# =========================
sio = socketio.AsyncServer(cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio, app)

# =========================
# STARTUP / SHUTDOWN
# =========================
@app.on_event("startup")
def startup():
    start_scheduler()


@app.on_event("shutdown")
def shutdown():
    stop_scheduler()


# =========================
# ROUTES
# =========================

@app.get("/scheduler/status")
def get_status():
    return scheduler_status()


@app.get("/exam/start/{exam_id}/{hall_id}")
def manual_start(exam_id: int, hall_id: int):
    from exam_controller import start_exam_worker
    start_exam_worker(exam_id, hall_id)
    return {"status": "started"}


@app.get("/exam/stop/{exam_id}/{hall_id}")
def manual_stop(exam_id: int, hall_id: int):
    from exam_controller import stop_exam_worker
    stop_exam_worker(exam_id, hall_id)
    return {"status": "stopped"}


# =========================
# STREAM ENDPOINT
# =========================
@app.get("/stream/{hall_id}")
def stream(hall_id: int):

    def generate():
        while True:
            frame = get_frame(hall_id)

            if frame is None:
                time.sleep(0.01)
                continue
            # safety check (VERY IMPORTANT)
            if not hasattr(frame, "shape"):
                continue

            success, buffer = cv2.imencode(".jpg", frame)

            if not success:
                continue
             
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" +
                buffer.tobytes() +
                b"\r\n"
            )

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# =========================
# SOCKET EMIT HELPER
# =========================
async def emit_alert(alert):
    await sio.emit("ai-alert", alert)