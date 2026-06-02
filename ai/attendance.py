import cv2
import numpy as np
import time
from datetime import datetime

from recognition import app
from load_embeddings import load_students
from db import DB


def get_absent_students(exam_id, hall_id):

    conn = DB.get_connection()
    cur = conn.cursor()

    try:

        print(f"[DB] Fetching absent students | exam_id={exam_id}, hall_id={hall_id}")

        cur.execute(
            """
            SELECT id
            FROM students
            WHERE hall_id=%s
            AND id NOT IN
            (
                SELECT student_id
                FROM attendance
                WHERE exam_id=%s
                AND status='present'
            )
            """,
            (hall_id, exam_id)
        )

        absent = [row[0] for row in cur.fetchall()]

        print(f"[DB] Absent students found: {len(absent)} -> {absent}")

        return absent

    finally:
        cur.close()


def mark_attendance(hall_id=1, exam_id=1, absent_only=False):

    print("\n========== ATTENDANCE START ==========")
    print(f"[INIT] hall_id={hall_id}, exam_id={exam_id}, absent_only={absent_only}")

    student_ids, student_names, known_embeddings = load_students()

    print(f"[LOAD] Total students loaded: {len(student_ids)}")

    if absent_only:

        print("\n[MODE] Absent-only mode enabled")

        absent_ids = get_absent_students(exam_id, hall_id)

        keep_indices = [
            i
            for i, student_id in enumerate(student_ids)
            if student_id in absent_ids
        ]

        student_ids = [student_ids[i] for i in keep_indices]
        student_names = [student_names[i] for i in keep_indices]
        known_embeddings = np.array([known_embeddings[i] for i in keep_indices])

        print(f"[FILTER] After absent filter: {len(student_ids)} students")

    cap = cv2.VideoCapture(0)

    print("[CAMERA] Opening camera...")

    time.sleep(5)

    ret, frame = cap.read()

    if not ret:
        cap.release()
        print("[ERROR] Camera failed to capture frame")
        return [], None

    print("[CAMERA] Frame captured successfully")

    faces = app.get(frame)

    print(f"[AI] Faces detected: {len(faces)}")

    results = []

    normalized_embeddings = (
        known_embeddings /
        np.linalg.norm(known_embeddings, axis=1, keepdims=True)
    )

    print("[AI] Embeddings normalized")

    conn = DB.get_connection()
    cur = conn.cursor()

    now = datetime.now()

    print(f"[TIME] Timestamp: {now}")

    for i, face in enumerate(faces):

        print(f"\n--- Processing Face {i+1}/{len(faces)} ---")

        embedding = face.embedding

        embedding = embedding / np.linalg.norm(embedding)

        similarity = np.dot(normalized_embeddings, embedding)

        idx = np.argmax(similarity)
        confidence = similarity[idx]

        print(f"[MATCH] Best index={idx}, confidence={confidence:.4f}")

        if confidence > 0.5:

            student = student_names[idx]
            student_id = student_ids[idx]

            print(f"[MATCH] Recognized student: {student} (ID: {student_id})")

            try:
                cur.execute(
                    """
                    INSERT INTO attendance
                    (
                        student_id,
                        verification_method,
                        date,
                        time_in,
                        status,
                        created_at,
                        confidence,
                        exam_id,
                        hall_id
                    )
                    VALUES
                    (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (student_id, exam_id, date)
                    DO NOTHING
                    """,
                    (
                        student_id,
                        "face_recognition",
                        now.date(),
                        now,
                        "present",
                        now,
                        round(float(confidence), 3),
                        exam_id,
                        hall_id
                    )
                )

                print(f"[DB] Attendance insert executed for {student}")

            except Exception as e:
                print(f"[DB ERROR] Attendance insert failed: {e}")

            results.append({
                "student_id": student_id,
                "student_name": student,
                "confidence": confidence,
                "bbox": face.bbox
            })

        else:

            print(f"[UNKNOWN] Low confidence face detected: {confidence:.4f}")

            try:
                cur.execute(
                    """
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
                    (gen_random_uuid(),%s,%s,%s,%s,%s,%s,%s,%s)
                    """,
                    (
                        "unknown_face",
                        round(float(confidence), 3),
                        now,
                        hall_id,
                        exam_id,
                        None,
                        None,
                        now
                    )
                )

                print("[DB] AI alert inserted")

            except Exception as e:
                print(f"[DB ERROR] Alert insert failed: {e}")

    conn.commit()
    print("[DB] Transaction committed")

    cur.close()
    cap.release()

    print("========== ATTENDANCE END ==========\n")

    return results, frame