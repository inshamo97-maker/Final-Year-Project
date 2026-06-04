from db import DB
from locks import db_lock


def should_start_whisper(hall_id):
    """
    Only checks if ANY microphone is active.
    Does NOT decide device type anymore.
    """

    conn = DB.get_connection()
    if not conn:
        return False

    try:
        cur = conn.cursor()

        with db_lock:
            cur.execute("""
                SELECT 1
                FROM microphones
                WHERE hall_id=%s
                AND is_active=true
                LIMIT 1
            """, (hall_id,))

        return cur.fetchone() is not None

    except Exception as e:
        print("[WHISPER GATE ERROR]", e)
        return False

    finally:
        conn.close()