import cv2
import time

from runtime_state import exam_running
from attendance import mark_attendance
from seating import verify_seating
from cheating import detect_cheating
from whisper_gate import should_start_whisper
from whisper_detector import detect_whisper
from camera_loader import open_hall_camera
from frame_broadcaster import push_frame, release

LATE_CHECK_SECONDS = 1800


def run_exam_worker(EXAM_ID, HALL_ID):

    session_key = (EXAM_ID, HALL_ID)
    exam_running[session_key] = True

    print(f"[WORKER] Started | exam_id={EXAM_ID} hall_id={HALL_ID}")

    cap = open_hall_camera(HALL_ID)

    if cap is None:
        print("[CAMERA] No camera available.")
        exam_running[session_key] = False
        return

    ret, startup_frame = cap.read()

    if not ret:
        print("[CAMERA] Failed startup frame.")
        cap.release()
        exam_running[session_key] = False
        return

    # attendance + seating
    attendance_results = mark_attendance(
        hall_id=HALL_ID,
        exam_id=EXAM_ID,
        frame=startup_frame
    )

    if attendance_results:
        verify_seating(
            attendance_results=attendance_results,
            frame=startup_frame,
            hall_id=HALL_ID,
            exam_id=EXAM_ID
        )

    # whisper (optional)
    try:
        if should_start_whisper(HALL_ID):
            detect_whisper(hall_id=HALL_ID, exam_id=EXAM_ID)
    except Exception as e:
        print("[WHISPER ERROR]", e)

    exam_start = time.time()
    late_done = False

    while exam_running.get(session_key, False):

        ret, frame = cap.read()
        if not ret:
            continue

        detect_cheating(frame, hall_id=HALL_ID, exam_id=EXAM_ID)
        push_frame(HALL_ID, frame)

        # late attendance check
        if not late_done and time.time() - exam_start > LATE_CHECK_SECONDS:
            mark_attendance(
                hall_id=HALL_ID,
                exam_id=EXAM_ID,
                absent_only=True,
                frame=frame
            )
            late_done = True

        cv2.imshow("EMS", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    release(HALL_ID)

    exam_running[session_key] = False
    print(f"[WORKER] Finished | exam_id={EXAM_ID}")