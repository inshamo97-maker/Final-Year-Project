from db import DB
import cv2
from locks import db_lock


def get_camera_source(hall_id=1):
    conn = DB.get_connection()
    cur = conn.cursor()

    try:
        with db_lock:
            cur.execute("""
                SELECT ip_address
                FROM cameras
                WHERE hall_id=%s
                AND is_active=true
                LIMIT 1
            """, (hall_id,))

        row = cur.fetchone()

        if not row:
            print("[CAMERA] No active camera found. Using webcam 0.")
            return 0

        source = row[0]

        # Support webcam index stored as text
        if str(source).isdigit():
            source = int(source)

        print(f"[CAMERA] Loaded source: {source}")

        return source

    except Exception as e:
        print("[CAMERA ERROR]", e)
        return 0

    finally:
        cur.close()






def open_hall_camera(hall_id):

    source = get_camera_source(hall_id)

    print(f"[CAMERA] Opening {source}")

    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print("[CAMERA] Failed to open camera")
        return None

    return cap