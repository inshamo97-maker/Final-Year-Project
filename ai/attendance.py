import cv2
import numpy as np
import time
from datetime import datetime

from recognition import app
from load_embeddings import load_students
from db import DB


def get_absent_students(
        exam_id,
        hall_id
):

    conn = DB.get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT id
            FROM students

            WHERE hall_id=%s

            AND id NOT IN
            (

                SELECT student_id

                FROM attendance

                WHERE
                exam_id=%s
                AND status='present'

            )
            """,

            (
                hall_id,
                exam_id
            )
        )

        absent = [

            row[0]
            for row
            in cur.fetchall()

        ]

        return absent

    finally:

        cur.close()


def mark_attendance(

        hall_id=1,
        exam_id=1,
        absent_only=False

):

    student_ids, student_names, known_embeddings = load_students()

    if absent_only:

        print(
            "\nChecking absent students only..."
        )

        absent_ids = get_absent_students(
            exam_id,
            hall_id
        )

        keep_indices = [

            i

            for i, student_id
            in enumerate(student_ids)

            if student_id in absent_ids

        ]

        student_ids = [

            student_ids[i]
            for i in keep_indices
        ]

        student_names = [

            student_names[i]
            for i in keep_indices
        ]

        known_embeddings = np.array([

            known_embeddings[i]
            for i in keep_indices

        ])

    print(
        f"Students loaded: {len(student_names)}"
    )

    cap = cv2.VideoCapture(0)

    print(
        "Taking snapshot in 5 seconds..."
    )

    time.sleep(5)

    ret, frame = cap.read()

    if not ret:

        cap.release()

        print(
            "Camera failed"
        )

        return [], None

    faces = app.get(
        frame
    )

    print(
        f"Faces detected: {len(faces)}"
    )

    results = []

    normalized_embeddings = (

        known_embeddings
        /
        np.linalg.norm(
            known_embeddings,
            axis=1,
            keepdims=True
        )

    )

    conn = DB.get_connection()

    cur = conn.cursor()

    now = datetime.now()

    for face in faces:

        embedding = face.embedding

        embedding = (

            embedding
            /
            np.linalg.norm(
                embedding
            )
        )

        similarity = np.dot(

            normalized_embeddings,
            embedding

        )

        idx = np.argmax(
            similarity
        )

        confidence = similarity[idx]

        if confidence > 0.70:

            student = student_names[idx]

            student_id = student_ids[idx]

            print(
                f"Recognized: {student}"
            )

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
                (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s
                )

                ON CONFLICT
                (
                    student_id,
                    exam_id,
                    date
                )

                DO NOTHING
                """,

                (

                    student_id,
                    "face_recognition",
                    now.date(),
                    now,
                    "present",
                    now,
                    round(
                        float(confidence),
                        3
                    ),
                    exam_id,
                    hall_id

                )
            )

            results.append({

                "student_id": student_id,
                "student_name": student,
                "confidence": confidence,
                "bbox": face.bbox

            })

        else:

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
                (
                    gen_random_uuid(),
                    %s,%s,%s,%s,%s,%s,%s,%s
                )
                """,

                (

                    "unknown_face",
                    round(
                        float(confidence),
                        3
                    ),
                    now,
                    hall_id,
                    exam_id,
                    None,
                    None,
                    now

                )
            )

    conn.commit()

    cur.close()

    cap.release()

    return results, frame