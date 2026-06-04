import cv2
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

def get_camera_for_hall(hall_id):
    # SIMPLE LOGIC (replace with DB later if needed)
    return 0 + int(hall_id)  # or just return hall_id mapping


def generate_frames(hall_id):
    camera_index = get_camera_for_hall(hall_id)
    cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        return

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                continue

            _, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            jpeg = buffer.tobytes()

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" +
                jpeg +
                b"\r\n"
            )

    finally:
        cap.release()


@app.get("/video-feed/{hall_id}")
def video_feed(hall_id: int):
    return StreamingResponse(
        generate_frames(hall_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )