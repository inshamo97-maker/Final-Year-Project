import json
import numpy as np
from db import DB


def load_students():

    conn = DB.get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            s.id,
            s.name,
            se.embedding
        FROM students s
        JOIN student_embeddings se
        ON s.id=se.student_id
        """
    )

    rows = cur.fetchall()

    student_ids = []
    student_names = []
    embeddings = []

    for student_id, name, emb in rows:

        student_ids.append(student_id)
        student_names.append(name)

        if isinstance(emb, str):
            emb = json.loads(emb)

        embeddings.append(np.array(emb))

    cur.close()

    

    print(
        "Students loaded:",
        len(student_names)
    )

    return (
        student_ids,
        student_names,
        np.array(embeddings)
    )