import cv2
import os
import uuid
import time
from datetime import datetime
from db import DB
from speaker_alert import trigger_alert
from locks import db_lock

EVIDENCE_DIR = "evidence/images/seating"

seat_alert_cooldown = {}


def save_seating_evidence(frame, student_id, exam_id, label):
    os.makedirs(EVIDENCE_DIR, exist_ok=True)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    path = os.path.join(
        EVIDENCE_DIR,
        f"seating_{student_id}_{exam_id}_{ts}.jpg"
    )

    cv2.imwrite(path, frame)

    return path


def verify_seating(
    attendance_results,
    frame,
    hall_id=1,
    exam_id=1
):
    print("\n========== SEATING VERIFICATION START ==========")

    if frame is None:
        print("[ERROR] No frame provided to verify_seating. Aborting.")
        return

    conn = DB.get_connection()
    cur = conn.cursor()
    now = datetime.now()

    with db_lock:
        cur.execute("""
            SELECT student_id, row_number, column_number
            FROM seat_allocations
            WHERE hall_id=%s AND exam_id=%s
        """, (hall_id, exam_id))

    rows_raw = cur.fetchall()

    if not rows_raw:
        print("[SEATING] No seat allocation data found for this exam/hall.")
        cur.close()
        return

    seat_map = {(r, c): sid for sid, r, c in rows_raw}
    expected_positions = {sid: (r, c) for (r, c), sid in seat_map.items()}

    rows = max(r for _, r, _ in rows_raw)
    cols = max(c for _, _, c in rows_raw)

    frame_h, frame_w = frame.shape[:2]

    print(f"[SEATING] Grid={rows}x{cols} | Frame={frame_w}x{frame_h}")

    for student in attendance_results:

        student_id = student["student_id"]
        student_name = student.get("student_name", str(student_id))
        bbox = student["bbox"]

        x1, y1, x2, y2 = map(int, bbox)

        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        detected_col = int(center_x / (frame_w / cols)) + 1
        detected_row = rows - int(center_y / (frame_h / rows))

        expected = expected_positions.get(student_id)

        print(f"\n[CHECK] {student_name} | detected=({detected_row},{detected_col}) | expected={expected}")

        # -------------------------
        # CASE 1: not in seat map
        # -------------------------
        if not expected:
            print(f"[SEATING] {student_name} not found in seat map")

            evidence_frame = frame.copy()
            cv2.rectangle(evidence_frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
            cv2.rectangle(evidence_frame, (x1, y1 - 25), (x2, y1), (0, 165, 255), -1)
            cv2.putText(
                evidence_frame,
                "NOT ASSIGNED",
                (x1 + 4, y1 - 7),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                2
            )

            snapshot_path = save_seating_evidence(evidence_frame, student_id, exam_id, "not_assigned")
            event_id = str(uuid.uuid4())

            with db_lock:
                cur.execute("""
                    INSERT INTO ai_alerts
                    (
                        event_id,
                        type,
                        confidence,
                        timestamp,
                        hall_id,
                        exam_id,
                        student_id,
                        violation_id,
                        created_at
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    event_id,
                    "seating_unknown_student",
                    1.0,
                    now,
                    hall_id,
                    exam_id,
                    student_id,
                    None,
                    now
                ))

                cur.execute("""
                    INSERT INTO alert_evidence
                    (event_id, evidence_type, file_path)
                    VALUES (%s,%s,%s)
                """, (event_id, "image", snapshot_path))

            continue

        exp_row, exp_col = expected

        # -------------------------
        # CASE 2: wrong seat
        # -------------------------
        if exp_row != detected_row or exp_col != detected_col:
            print(f"[SEATING] VIOLATION — {student_name} in wrong seat")

            evidence_frame = frame.copy()
            cv2.rectangle(evidence_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.rectangle(evidence_frame, (x1, y1 - 25), (x2, y1), (0, 0, 255), -1)
            cv2.putText(
                evidence_frame,
                "WRONG SEAT",
                (x1 + 4, y1 - 7),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                2
            )

            snapshot_path = save_seating_evidence(evidence_frame, student_id, exam_id, "wrong_seat")
            event_id = str(uuid.uuid4())

            last = seat_alert_cooldown.get(student_id, 0)

            if time.time() - last > 10:
                trigger_alert(
                    roll_number=str(student_id),
                    reason="you are sitting in the wrong seat. Please proceed to your correct seat.",
                    exam_id=str(exam_id)
                )
                seat_alert_cooldown[student_id] = time.time()

            with db_lock:
                cur.execute("""
                    INSERT INTO ai_alerts
                    (
                        event_id,
                        type,
                        confidence,
                        timestamp,
                        hall_id,
                        exam_id,
                        student_id,
                        violation_id,
                        created_at
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    event_id,
                    "seating_violation",
                    1.0,
                    now,
                    hall_id,
                    exam_id,
                    student_id,
                    None,
                    now
                ))

                cur.execute("""
                    INSERT INTO alert_evidence
                    (event_id, evidence_type, file_path)
                    VALUES (%s,%s,%s)
                """, (event_id, "image", snapshot_path))

        # -------------------------
        # CASE 3: correct seat
        # -------------------------
        else:
            print(f"[SEATING] OK — {student_name}")

            with db_lock:
                cur.execute("""
                    INSERT INTO ai_alerts
                    (
                        event_id,
                        type,
                        confidence,
                        timestamp,
                        hall_id,
                        exam_id,
                        student_id,
                        violation_id,
                        created_at
                    )
                    VALUES (gen_random_uuid(),%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    "seating_ok",
                    1.0,
                    now,
                    hall_id,
                    exam_id,
                    student_id,
                    None,
                    now
                ))

    # -------------------------
    # CASE 4: absent students
    # (allocated but not detected)
    # -------------------------
    detected_ids = {student["student_id"] for student in attendance_results}

    for (exp_row, exp_col), student_id in seat_map.items():
        if student_id in detected_ids:
            continue

        print(f"[ABSENT] student_id={student_id} was not detected in frame")

        event_id = str(uuid.uuid4())

        with db_lock:
            cur.execute("""
                INSERT INTO attendance (student_id, exam_id, hall_id, status)
                VALUES (%s, %s, %s, 'absent')
                ON CONFLICT (student_id, exam_id)
                DO NOTHING
            """, (student_id, exam_id, hall_id))

            cur.execute("""
                INSERT INTO ai_alerts
                (event_id, type, confidence, timestamp, hall_id, exam_id, student_id, violation_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                event_id,
                "absent",
                1.0,
                now,
                hall_id,
                exam_id,
                student_id,
                None,
                now
            ))

    conn.commit()
    cur.close()

    print("========== SEATING VERIFICATION COMPLETE ==========\n")