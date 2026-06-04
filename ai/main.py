import cv2
import time
from runtime_state import exam_running
from attendance import mark_attendance
from seating import verify_seating
from cheating import detect_cheating
from db import DB
from whisper_gate import should_start_whisper
from camera_loader import open_hall_camera
def run_exam_worker(EXAM_ID, HALL_ID):
    session_key = (EXAM_ID, HALL_ID)
    exam_running[session_key] = True
    LATE_CHECK_SECONDS = 1800

    print("EMS Worker Started")
    print("Exam ID:", EXAM_ID, "Hall ID:", HALL_ID)

    # =========================
    # ATTENDANCE + SEATING
    # =========================
    attendance_results, frame = mark_attendance(
        hall_id=HALL_ID,
        exam_id=EXAM_ID
    )

    if frame is not None:
        verify_seating(
            attendance_results=attendance_results,
            frame_shape=frame.shape,
            hall_id=HALL_ID,
            exam_id=EXAM_ID
        )

    # =========================
    # WHISPER GATE (SAFE)
    # =========================
    try:
        whisper_enabled = should_start_whisper(HALL_ID)
    except Exception as e:
        print(f"[WHISPER GATE ERROR] {e}")
        whisper_enabled = False

    print(
        "[WHISPER] Enabled" if whisper_enabled
        else "[WHISPER] Disabled"
    )
    if whisper_enabled:
        from whisper_detector import detect_whisper

        detect_whisper(
            hall_id=HALL_ID,
            exam_id=EXAM_ID
        )
    
    # =========================
    # CAMERA LOOP
    # =========================
    exam_start = time.time()
    late_check_done = False

    cap = open_hall_camera(HALL_ID)

    if cap is None:
        print("[CAMERA] No camera available")
        return

    try:
        while exam_running.get(session_key, False):

            ret, frame = cap.read()
            if not ret:
                break

            # CHEATING DETECTION
            detect_cheating(
                frame,
                hall_id=HALL_ID,
                exam_id=EXAM_ID
            )

            # LATE CHECK
            elapsed = time.time() - exam_start

            if elapsed >= LATE_CHECK_SECONDS and not late_check_done:

                print("30 minute attendance check...")

                mark_attendance(
                    hall_id=HALL_ID,
                    exam_id=EXAM_ID,
                    absent_only=True
                )

                late_check_done = True

            cv2.imshow("EMS", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()

        conn = DB.get_connection()
        if conn:
            conn.close()

        print("EMS Worker Finished")