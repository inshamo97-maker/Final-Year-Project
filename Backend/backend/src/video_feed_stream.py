import cv2
import sys


BOUNDARY = "frame"


def write_frame(jpeg_bytes):
    header = (
        f"--{BOUNDARY}\r\n"
        f"Content-Type: image/jpeg\r\n"
        f"Content-Length: {len(jpeg_bytes)}\r\n\r\n"
    ).encode("utf-8")
    sys.stdout.buffer.write(header)
    sys.stdout.buffer.write(jpeg_bytes)
    sys.stdout.buffer.write(b"\r\n")
    sys.stdout.flush()


def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                continue

            success, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if not success:
                continue

            write_frame(buffer.tobytes())
    except KeyboardInterrupt:
        pass
    finally:
        cap.release()


if __name__ == "__main__":
    main()
