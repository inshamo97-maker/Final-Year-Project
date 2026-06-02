import os
import cv2
import json
from insightface.app import FaceAnalysis
from db import DB
conn = DB.get_connection()

app = FaceAnalysis(name='buffalo_s')
app.prepare(ctx_id=-1)

PHOTO_FOLDER = r"C:\Users\salee\Downloads\FULL Project\photos"

cur=conn.cursor()

for file in os.listdir(PHOTO_FOLDER):

    path=os.path.join(
        PHOTO_FOLDER,
        file
    )

    print("Processing:",file)

    registration_number=file.split("_")[0]

    img=cv2.imread(path)

    if img is None:
        print("Cannot read:",file)
        continue

    faces=app.get(img)

    if len(faces)==0:
        print("No face:",file)
        continue

    embedding=faces[0].embedding.tolist()

    cur.execute(
        """
        SELECT id,name
        FROM students
        WHERE registration_number=%s
        """,
        (registration_number,)
    )

    student=cur.fetchone()

    if not student:
        print(
            "Student not found:",
            registration_number
        )
        continue

    student_id=student[0]
    student_name=student[1]

    cur.execute(
        """
        SELECT id
        FROM student_embeddings
        WHERE student_id=%s
        """,
        (student_id,)
    )

    exists=cur.fetchone()

    if exists:

        cur.execute(
            """
            UPDATE student_embeddings
            SET embedding=%s,
                updated_at=NOW()
            WHERE student_id=%s
            """,
            (
                json.dumps(embedding),
                student_id
            )
        )

        print(
            "Updated:",
            student_name
        )

    else:

        cur.execute(
            """
            INSERT INTO student_embeddings
            (
                student_id,
                embedding,
                created_at,
                updated_at
            )
            VALUES
            (
                %s,
                %s,
                NOW(),
                NOW()
            )
            """,
            (
                student_id,
                json.dumps(embedding)
            )
        )

        print(
            "Inserted:",
            student_name
        )

conn.commit()

cur.close()
conn.close()

print("Done")