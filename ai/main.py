import cv2
import time
import sys

from attendance import mark_attendance
from seating import verify_seating
from cheating import detect_cheating
from db import DB


EXAM_ID = int(sys.argv[1])
HALL_ID = int(sys.argv[2])

LATE_CHECK_SECONDS = 1800


print("EMS Worker Started")
print("Exam ID:", EXAM_ID, "Hall ID:", HALL_ID)


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


exam_start = time.time()
late_check_done = False

cap = cv2.VideoCapture(0)

try:

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        detect_cheating(
            frame,
            hall_id=HALL_ID,
            exam_id=EXAM_ID
        )

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