import cv2
import mediapipe as mp
import numpy as np
import time
from datetime import datetime

from db import DB
conn = None
cur = None

mp_face_mesh = mp.solutions.face_mesh

face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=10,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)


YAW_THRESHOLD=18
PITCH_THRESHOLD=18

CHEAT_TIME=3
ALERT_COOLDOWN_SECONDS = 3

CACHE_TTL_SECONDS = 300

cheat_start = {}
last_alert_sent = {}

hall_cache = {}
student_cache = {}


def get_student_name(student_id):

    if student_id in student_cache:
        return student_cache[student_id]

    conn = DB.get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT name
        FROM students
        WHERE id=%s
        """,
        (student_id,)
    )

    row = cur.fetchone()

    cur.close()
    

    name = row[0] if row else f"Student {student_id}"

    student_cache[student_id] = name

    return name


def draw_box(
        frame,
        x1,
        y1,
        x2,
        y2,
        text,
        color
):

    cv2.rectangle(
        frame,
        (x1, y1),
        (x2, y2),
        color,
        2
    )

    cv2.rectangle(
        frame,
        (x1, y1 - 25),
        (x2, y1),
        color,
        -1
    )

    cv2.putText(
        frame,
        text,
        (x1 + 5, y1 - 7),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (0,0,0),
        2
    )


def load_seat_data(
        hall_id,
        exam_id
):

    cache_key = (
        hall_id,
        exam_id
    )

    current_time = time.time()

    cached = hall_cache.get(
        cache_key
    )

    if cached:

        age = (

            current_time
            -
            cached["loaded_at"]

        )

        if age < CACHE_TTL_SECONDS:
            return cached

    conn = DB.get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            student_id,
            row_number,
            column_number
        FROM seat_allocations
        WHERE
            hall_id=%s
            AND exam_id=%s
        """,
        (
            hall_id,
            exam_id
        )
    )

    rows = cur.fetchall()

    seat_map = {}

    max_row = 0
    max_col = 0

    for student_id, row, col in rows:

        seat_map[
            (
                row,
                col
            )
        ] = student_id

        max_row = max(
            max_row,
            row
        )

        max_col = max(
            max_col,
            col
        )

    cache = {

        "loaded_at": current_time,

        "layout": (
            max_row,
            max_col
        ),

        "seats": seat_map

    }

    hall_cache[
        cache_key
    ] = cache

    print(
        f"Loaded {len(seat_map)} seats"
    )

    cur.close()
    

    return cache


def cleanup_cache():

    current_time = time.time()

    expired = []

    for key, data in hall_cache.items():

        age = (

            current_time
            -
            data["loaded_at"]

        )

        if age > CACHE_TTL_SECONDS:
            expired.append(key)

    for key in expired:

        hall_cache.pop(
            key,
            None
        )


def get_head_pose(
        landmarks,
        img_w,
        img_h
):

    face_2d = []
    face_3d = []

    indices = [

        33,
        263,
        1,
        61,
        291,
        199

    ]

    for idx in indices:

        lm = landmarks[idx]

        x = int(
            lm.x * img_w
        )

        y = int(
            lm.y * img_h
        )

        face_2d.append(
            [x, y]
        )

        face_3d.append(
            [x, y, lm.z]
        )

    face_2d = np.array(
        face_2d,
        dtype=np.float64
    )

    face_3d = np.array(
        face_3d,
        dtype=np.float64
    )

    focal_length = img_w

    cam_matrix = np.array([

        [
            focal_length,
            0,
            img_w / 2
        ],

        [
            0,
            focal_length,
            img_h / 2
        ],

        [
            0,
            0,
            1
        ]

    ])

    dist_matrix = np.zeros(
        (4,1),
        dtype=np.float64
    )

    success, rot_vec, trans_vec = cv2.solvePnP(

        face_3d,
        face_2d,
        cam_matrix,
        dist_matrix

    )

    if not success:
        return None

    rmat, _ = cv2.Rodrigues(
        rot_vec
    )

    angles, _, _, _, _, _ = cv2.RQDecomp3x3(
        rmat
    )

    pitch = angles[0] * 360
    yaw = angles[1] * 360
    roll = angles[2] * 360

    return (
        pitch,
        yaw,
        roll
    )

def draw_seat_grid(
        frame,
        rows,
        cols,
        seat_map,
        w,
        h
):

    seat_width = w / cols
    seat_height = h / rows

    for row in range(1, rows+1):

        for col in range(1, cols+1):

            x1 = int(
                (col-1)*seat_width
            )

            y1 = int(
                h - row*seat_height
            )

            x2 = int(
                col*seat_width
            )

            y2 = int(
                h-(row-1)*seat_height
            )

            cv2.rectangle(
                frame,
                (x1,y1),
                (x2,y2),
                (255,255,255),
                1
            )

            student_id = seat_map.get(
                (row,col)
            )

            if student_id:

                text = str(
                    student_id
                ).zfill(6)

            else:

                text = "EMPTY"

            cv2.putText(
                frame,
                text,
                (
                    x1+10,
                    y1+25
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255,255,255),
                1
            )
def detect_cheating(
        frame,
        hall_id=1,
        exam_id=1
):

    cleanup_cache()

    cache = load_seat_data(
        hall_id,
        exam_id
    )

    rows, cols = cache["layout"]
    seat_map = cache["seats"]

    if rows == 0 or cols == 0:
        return

    h, w, _ = frame.shape
    draw_seat_grid(
    frame,
    rows,
    cols,
    seat_map,
    w,
    h
)

    seat_width = w / cols
    seat_height = h / rows

    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    results = face_mesh.process(
        rgb
    )

    if not results.multi_face_landmarks:
        return

    global conn,cur

    if conn is None:

        conn = DB.get_connection()
        cur = conn.cursor()

    now = datetime.now()

    for face_landmarks in results.multi_face_landmarks:

        pose = get_head_pose(
            face_landmarks.landmark,
            w,
            h
        )

        if pose is None:
            continue

        pitch, yaw, roll = pose

        xs = [
            lm.x
            for lm in face_landmarks.landmark
        ]

        ys = [
            lm.y
            for lm in face_landmarks.landmark
        ]

        x_min = int(min(xs) * w)
        x_max = int(max(xs) * w)

        y_min = int(min(ys) * h)
        y_max = int(max(ys) * h)

        center_x = (x_min + x_max ) / 2

        center_y = (y_min + y_max ) / 2

        face_width = x_max - x_min
        face_height = y_max - y_min

        face_area = face_width * face_height
        frame_area = w * h

        face_ratio = face_area / frame_area

        if face_ratio < 0.02:
            continue
        detected_col = int(
            center_x / seat_width
        ) + 1

        detected_row = rows - int(
            center_y / seat_height
        )

        seat_key = (
            detected_row,
            detected_col
        )

        student_id = seat_map.get(
            seat_key
        )

        if student_id is None:
            continue

        student_name = get_student_name(student_id)

        cheating = (

            abs(yaw) > YAW_THRESHOLD
            or
            abs(pitch) > PITCH_THRESHOLD

        )

        color = (0,255,0)
        status = "Normal"

        if cheating:

            color = (0,0,255)
            status = "CHEATING"

            if student_id not in cheat_start:

                cheat_start[
                    student_id
                ] = time.time()

            duration = (

                time.time()
                -
                cheat_start[
                    student_id
                ]
            )

            previous = last_alert_sent.get(
                student_id,
                0
            )

            if (

                duration > CHEAT_TIME
                and
                time.time()
                -
                previous
                >
                ALERT_COOLDOWN_SECONDS

            ):

                movement_score = max(
                    abs(yaw),
                    abs(pitch)
                )

                confidence = min(
                    1.0,
                    movement_score / 45
                )

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

                        "head_movement",
                        confidence,
                        now,
                        hall_id,
                        str(exam_id),
                        str(student_id),
                        None,
                        now

                    )
                )

                print(
                    f"{student_name} cheating"
                )

                print(
                    f"Yaw={yaw:.1f}"
                )

                print(
                    f"Pitch={pitch:.1f}"
                )

                last_alert_sent[
                    student_id
                ] = time.time()

        else:

            cheat_start.pop(
                student_id,
                None
            )

        draw_box(
            frame,
            x_min,
            y_min,
            x_max,
            y_max,
            f"{student_name} | {status}",
            color
        )

        cv2.putText(
            frame,
            f"Y:{yaw:.1f} P:{pitch:.1f}",
            (x_min, y_max + 15),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            1
        )

    conn.commit()


    return frame