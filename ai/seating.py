from datetime import datetime
from db import DB
from speaker_alert import trigger_alert
def verify_seating(
    attendance_results,
    frame_shape,
    hall_id=1,
    exam_id=3
):

    print("\nStarting seating verification...")

    conn = DB.get_connection()
    cur = conn.cursor()
    now = datetime.now()

    print("DB CONNECTED OK")

    cur.execute("SELECT current_database(), current_schema();")
    print("DB INFO:", cur.fetchone())

    cur.execute("SELECT COUNT(*) FROM seat_allocations")
    print("TOTAL SEAT ROWS:", cur.fetchone())

    cur.execute("""
        SELECT student_id, row_number, column_number, hall_id, exam_id
        FROM seat_allocations
    """)

    all_rows = cur.fetchall()
    print("FULL TABLE SAMPLE:", all_rows)

    cur.execute("""
        SELECT student_id, row_number, column_number
        FROM seat_allocations
        WHERE hall_id=%s AND exam_id=%s
    """, (hall_id, exam_id))

    rows_raw = cur.fetchall()
    print("FILTERED ROWS:", rows_raw)

    if not rows_raw:
        print("❌ FILTER IS THE PROBLEM (NO DATA MATCHING)")
        cur.close()
        return

    seat_map = {(r, c): sid for sid, r, c in rows_raw}
    expected_positions = {sid: (r, c) for (r, c), sid in seat_map.items()}

    print("EXPECTED POSITIONS:", expected_positions)

    rows = max(r for _, r, _ in rows_raw)
    cols = max(c for _, _, c in rows_raw)

    print("GRID SIZE -> rows:", rows, "cols:", cols)

    frame_h, frame_w = frame_shape[:2]

    for student in attendance_results:

        student_id = student["student_id"]
        bbox = student["bbox"]

        x1, y1, x2, y2 = map(int, bbox)

        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        detected_col = int(center_x / (frame_w / cols)) + 1
        detected_row = rows - int(center_y / (frame_h / rows))

        expected = expected_positions.get(student_id)

        print("\n--- STUDENT CHECK ---")
        print("Student:", student_id)
        print("Detected:", (detected_row, detected_col))
        print("Expected:", expected)

        if not expected:
            print("⚠ NOT IN SEAT MAP")

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
                VALUES
                (
                    gen_random_uuid(),
                    %s,%s,%s,%s,%s,%s,%s,%s
                )
            """, (
                "seating_unknown_student",
                1.0,
                now,
                hall_id,
                exam_id,
                student_id,
                None,
                now
            ))

            continue

        exp_row, exp_col = expected

        if (exp_row != detected_row or exp_col != detected_col):

            print("❌ SEAT VIOLATION")
            trigger_alert(
                roll_number=str(student_id),
                reason="you are in the wrong seat. Please move to your correct seat",
                exam_id=str(exam_id)
)
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
                VALUES
                (
                    gen_random_uuid(),
                    %s,%s,%s,%s,%s,%s,%s,%s
                )
            """, (
                "seating_violation",
                1.0,
                now,
                hall_id,
                exam_id,
                student_id,
                None,
                now
            ))

        else:
            print("✔ OK")

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
                VALUES
                (
                    gen_random_uuid(),
                    %s,%s,%s,%s,%s,%s,%s,%s
                )
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

    conn.commit()
    cur.close()

    print("\nSeating verification complete")