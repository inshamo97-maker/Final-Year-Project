from db import DB
from locks import db_lock


def get_microphone_device(hall_id=1):
    """
    Returns a unified microphone device object:
    {
        "type": "local" | "ip",
        "source": int | str
    }
    """

    conn = DB.get_connection()
    cur = conn.cursor()

    try:
        with db_lock:
            cur.execute("""
                SELECT ip_address
                FROM microphones
                WHERE hall_id=%s
                AND is_active=true
                LIMIT 1
            """, (hall_id,))

        row = cur.fetchone()

        if not row:
            print("[MIC] No microphone found")
            return None

        source = str(row[0]).strip()

        # ----------------------------
        # CASE 1: LOCAL DEVICE (INDEX)
        # ----------------------------
        if source.isdigit():
            return {
                "type": "local",
                "source": int(source)
            }

        # ----------------------------
        # CASE 2: IP / HTTP DEVICE
        # ----------------------------
        if source.startswith("http://") or source.startswith("https://"):
            return {
                "type": "ip",
                "source": source
            }

        # fallback
        return {
            "type": "unknown",
            "source": source
        }

    finally:
        cur.close()