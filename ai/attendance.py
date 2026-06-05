import cv2
import numpy as np
from datetime import datetime
from locks import db_lock
from recognition import app
from load_embeddings import load_students
from db import DB
import uuid
import os
import requests

EVIDENCE_DIR = "evidence/images/unknown_faces"
ATTENDANCE_EVIDENCE_DIR = "evidence/images/attendance"

API_BASE = "http://localhost:5000"
AI_KEY   = "eyeson-ai-key-2024"
HEADERS  = {
    "x-ai-key": AI_KEY,
    "Content-Type": "application/json"
}


def save_unknown_snapshot(frame, student_id="unknown", exam_id="unknown"):
    os.makedirs(EVIDENCE_DIR, exist_ok=True)
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(
        EVIDENCE_DIR,
        f"unknown_{student_id}_{exam_id}_{ts}.jpg"
    )
    # Brighten dark frames before saving
    brightened = cv2.convertScaleAbs(frame, alpha=1.8, beta=40)
    cv2.imwrite(path, brightened)
    return path

def save_attendance_evidence(frame, exam_id):
    os.makedirs(ATTENDANCE_EVIDENCE_DIR, exist_ok=True)
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(ATTENDANCE_EVIDENCE_DIR, f"attendance_{exam_id}_{ts}.jpg")
    cv2.imwrite(path, frame)
    return path


def get_absent_students(exam_id, hall_id):
    conn = DB.get_connection()
    cur  = conn.cursor()

    try:
        print(f"[DB] Fetching absent students | exam_id={exam_id}, hall_id={hall_id}")

        with db_lock:
            cur.execute(
                """
                SELECT id
                FROM students
                WHERE hall_id=%s
                AND id NOT IN (
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


def notify_express_attendance(student_id, confidence, hall_id, exam_id):
    """
    Tell Express a student was marked present.
    Express does NOT write to DB — Python already did.
    Express just fires the socket event so the frontend updates live.
    """
    try:
        requests.post(
            f"{API_BASE}/ai/attendance",
            json={
                "student_id": str(student_id),
                "confidence": round(confidence, 3),
                "hall_id":    hall_id,
                "exam_id":    exam_id
            },
            headers=HEADERS,
            timeout=3
        )
    except Exception as e:
        print(f"[HTTP] Attendance notify failed (non-fatal): {e}")


def notify_express_alert(event_id, confidence, hall_id, exam_id, now):
    """
    Tell Express an unknown face alert was created.
    Express does NOT write to DB — Python already did.
    Express just fires the socket event so the frontend updates live.
    """
    try:
        requests.post(
            f"{API_BASE}/ai/alert",
            json={
                "event_id":   event_id,
                "type":       "unknown_face",
                "confidence": round(confidence, 3),
                "timestamp":  now.isoformat(),
                "hall_id":    hall_id,
                "exam_id":    exam_id,
                "student_id": None
            },
            headers=HEADERS,
            timeout=3
        )
    except Exception as e:
        print(f"[HTTP] Alert notify failed (non-fatal): {e}")


def mark_attendance(hall_id=1, exam_id=1, absent_only=False, frame=None):

    print("\n========== ATTENDANCE START ==========")
    print(f"[INIT] hall_id={hall_id}, exam_id={exam_id}, absent_only={absent_only}")

    if frame is None:
        print("[ERROR] No frame provided to mark_attendance. Aborting.")
        return []

    student_ids, student_names, known_embeddings = load_students()
    print(f"[LOAD] Total students loaded: {len(student_ids)}")

    if absent_only:
        print("[MODE] Absent-only mode enabled")
        absent_ids   = get_absent_students(exam_id, hall_id)
        keep_indices = [i for i, sid in enumerate(student_ids) if sid in absent_ids]
        student_ids      = [student_ids[i]      for i in keep_indices]
        student_names    = [student_names[i]    for i in keep_indices]
        known_embeddings = np.array([known_embeddings[i] for i in keep_indices])
        print(f"[FILTER] After absent filter: {len(student_ids)} students")

    if len(student_ids) == 0:
        print("[ATTENDANCE] No students to process.")
        return []

    faces = app.get(frame)
    print(f"[AI] Faces detected: {len(faces)}")

    results = []

    normalized_embeddings = (
        known_embeddings / np.linalg.norm(known_embeddings, axis=1, keepdims=True)
    )
    print("[AI] Embeddings normalized")

    conn = DB.get_connection()
    cur  = conn.cursor()
    now  = datetime.now()

    evidence_frame = frame.copy()

    for i, face in enumerate(faces):

        print(f"\n--- Processing Face {i+1}/{len(faces)} ---")

        embedding  = face.embedding / np.linalg.norm(face.embedding)
        similarity = np.dot(normalized_embeddings, embedding)
        idx        = np.argmax(similarity)
        confidence = float(similarity[idx])

        print(f"[MATCH] Best index={idx}, confidence={confidence:.4f}")

        x1, y1, x2, y2 = map(int, face.bbox)

        if confidence > 0.5:

            student    = student_names[idx]
            student_id = student_ids[idx]

            print(f"[MATCH] Recognized: {student} (ID: {student_id})")

            cv2.rectangle(evidence_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.rectangle(evidence_frame, (x1, y1 - 25), (x2, y1), (0, 255, 0), -1)
            cv2.putText(
                evidence_frame, student, (x1 + 4, y1 - 7),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2
            )

            try:
                with db_lock:
                    cur.execute(
                        """
                        INSERT INTO attendance
                        (
                            student_id, verification_method, date, time_in,
                            status, created_at, confidence, exam_id, hall_id
                        )
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (student_id, exam_id, date) DO NOTHING
                        """,
                        (
                            student_id, "face_recognition",
                            now.date(), now, "present", now,
                            round(confidence, 3), exam_id, hall_id
                        )
                    )
                print(f"[DB] Attendance inserted for {student}")

            except Exception as e:
                print(f"[DB ERROR] Attendance insert failed: {e}")

            # ← NEW: tell Express → fires socket to frontend
            notify_express_attendance(student_id, confidence, hall_id, exam_id)

            results.append({
                "student_id":   student_id,
                "student_name": student,
                "confidence":   confidence,
                "bbox":         face.bbox
            })

        else:
            print(f"[UNKNOWN] Low confidence: {confidence:.4f}")

            cv2.rectangle(evidence_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.rectangle(evidence_frame, (x1, y1 - 25), (x2, y1), (0, 0, 255), -1)
            cv2.putText(
                evidence_frame, "UNKNOWN", (x1 + 4, y1 - 7),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2
            )

            snapshot_path = save_unknown_snapshot(evidence_frame, "unknown", exam_id)           
            event_id      = str(uuid.uuid4())

            try:
                with db_lock:
                    cur.execute(
                        """
                        INSERT INTO ai_alerts
                        (event_id, type, confidence, timestamp, hall_id, exam_id, student_id, violation_id, created_at)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        """,
                        (event_id, "unknown_face", round(confidence, 3), now, hall_id, exam_id, None, None, now)
                    )
                    cur.execute(
                        """
                        INSERT INTO alert_evidence (event_id, evidence_type, file_path)
                        VALUES (%s,%s,%s)
                        """,
                        (event_id, "image", snapshot_path)
                    )
                print("[DB] Unknown face alert + evidence inserted")

            except Exception as e:
                print(f"[DB ERROR] Alert insert failed: {e}")

            # ← NEW: tell Express → fires socket to frontend
            notify_express_alert(event_id, confidence, hall_id, exam_id, now)

    evidence_path = save_attendance_evidence(evidence_frame, exam_id)
    print(f"[EVIDENCE] Attendance snapshot saved -> {evidence_path}")

    conn.commit()
    print("[DB] Transaction committed")
    cur.close()

    print("========== ATTENDANCE END ==========\n")
    return results