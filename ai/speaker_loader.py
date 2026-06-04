from db import DB
from locks import db_lock


def get_speaker_source(hall_id=1):
    conn = DB.get_connection()
    cur = conn.cursor()

    try:
        with db_lock:
            cur.execute("""
                SELECT ip_address
                FROM speakers
                WHERE hall_id=%s
                AND is_active=true
                LIMIT 1
            """, (hall_id,))

        row = cur.fetchone()

        if not row:
            print("[SPEAKER] No active speaker found. Using local engine.")
            return "local"

        source = row[0]

        # if numeric → local device id (future USB speaker support)
        if str(source).isdigit():
            source = int(source)

        print(f"[SPEAKER] Loaded source: {source}")
        return source

    except Exception as e:
        print("[SPEAKER ERROR]", e)
        return "local"

    finally:
        cur.close()