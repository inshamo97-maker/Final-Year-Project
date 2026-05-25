import cv2
import numpy as np

from recognition import app
from load_embeddings import load_students

# Load students + embeddings
student_names, known_embeddings = load_students()

print("Students loaded:", len(student_names))

if len(known_embeddings) == 0:
    print("No embeddings found in database")
    exit()

cap = cv2.VideoCapture(0)

while True:

    ret, frame = cap.read()

    if not ret:
        break

    faces = app.get(frame)

    for face in faces:

        embedding = face.embedding

        # similarity against all known students
        similarity = np.dot(
            known_embeddings,
            embedding
        )

        idx = np.argmax(similarity)

        confidence = similarity[idx]

        print(
            f"Best match: {student_names[idx]} | Score: {confidence:.3f}"
        )

        # adjust threshold if needed
        if confidence > 0.45:
            student = student_names[idx]
        else:
            student = "Unknown"

        x1, y1, x2, y2 = map(
            int,
            face.bbox
        )

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            student,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

    cv2.imshow(
        "Exam AI",
        frame
    )

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()