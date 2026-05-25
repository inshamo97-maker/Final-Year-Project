import psycopg2
import json
import numpy as np
from db import get_connection


def load_students():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT s.name, se.embedding
        FROM students s
        JOIN student_embeddings se
        ON s.id = se.student_id
    """)

    rows = cur.fetchall()

    student_names = []
    embeddings = []

    for name, emb in rows:
        student_names.append(name)

        if isinstance(emb, str):
            emb = json.loads(emb)

        embeddings.append(np.array(emb))

    cur.close()
    conn.close()

    print(f"Students loaded: {len(student_names)}")

    return student_names, np.array(embeddings)