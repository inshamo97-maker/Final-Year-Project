import numpy as np
import sounddevice as sd
import torch
import time
from datetime import datetime

from db import DB


print("Loading Silero VAD...")

model, utils = torch.hub.load(
    repo_or_dir='snakers4/silero-vad',
    model='silero_vad',
    force_reload=False
)

(
    get_speech_timestamps,
    _,
    read_audio,
    *_
) = utils

print("Silero loaded")


SAMPLE_RATE = 16000
BLOCK_SIZE = 512

ALERT_DURATION = 2.0
GRACE_PERIOD = 1.0

ALERT_COOLDOWN = 30

DEVICE_INDEX = None


speech_start = {}
speech_grace = {}
alerted = {}

last_alert_time = {}


def int2float(sound):

    sound = sound.astype(
        np.float32
    )

    abs_max = np.abs(
        sound
    ).max()

    if abs_max > 0:

        sound *= (
            1 / 32768
        )

    return sound.squeeze()


def should_alert(
        mic_id
):

    previous = last_alert_time.get(
        mic_id,
        0
    )

    return (

        time.time()
        -
        previous

        >=

        ALERT_COOLDOWN

    )


def get_candidate_students(
        hall_id,
        exam_id,
        mic_id
):

    conn = DB.get_connection()

    cur = conn.cursor()

    try:

        # demo version:
        # one microphone = entire hall

        cur.execute(
            """
            SELECT student_id
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

        students = [

            row[0]
            for row
            in cur.fetchall()

        ]

        return students

    finally:

        cur.close()
        conn.close()


def create_whisper_alert(

        hall_id,
        exam_id,
        mic_id

):

    candidates = get_candidate_students(

        hall_id,
        exam_id,
        mic_id

    )

    if not candidates:

        print(
            "No students found"
        )

        return

    conn = DB.get_connection()

    cur = conn.cursor()

    now = datetime.now()

    try:

        for student_id in candidates:

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

                    "whisper_detected",

                    0.80,

                    now,

                    hall_id,

                    str(exam_id),

                    str(student_id),

                    None,

                    now

                )

            )

        conn.commit()

        print(
            f"Whisper detected near students:"
        )

        print(
            candidates
        )

    finally:

        cur.close()
        conn.close()


def start_whisper_detection(

        hall_id=1,
        exam_id=1

):

    mic_id = "mic_0"

    print()

    print(
        "Speech detection started"
    )

    print(
        "Press Ctrl+C to stop"
    )

    print()

    try:

        def callback(

                indata,
                frames,
                time_info,
                status
        ):

            audio_chunk = int2float(

                np.frombuffer(
                    indata,
                    dtype=np.int16
                )

            )

            tensor = torch.tensor(
                audio_chunk
            )

            with torch.no_grad():

                confidence = model(
                    tensor,
                    SAMPLE_RATE
                ).item()

            is_speech = (

                confidence > 0.5

            )

            if is_speech:

                speech_grace.pop(
                    mic_id,
                    None
                )

                if mic_id not in speech_start:

                    speech_start[
                        mic_id
                    ] = time.time()

                    alerted[
                        mic_id
                    ] = False

                duration = (

                    time.time()
                    -
                    speech_start[
                        mic_id
                    ]

                )

                if (

                    duration >= ALERT_DURATION
                    and
                    not alerted.get(
                        mic_id
                    )

                ):

                    print()

                    print(
                        f"Speech detected"
                    )

                    print(
                        f"Duration={duration:.1f}"
                    )

                    print(
                        f"Confidence={confidence:.2f}"
                    )

                    if should_alert(
                            mic_id
                    ):

                        create_whisper_alert(

                            hall_id,
                            exam_id,
                            mic_id

                        )

                        last_alert_time[
                            mic_id
                        ] = time.time()

                    alerted[
                        mic_id
                    ] = True

            else:

                if mic_id in speech_start:

                    if mic_id not in speech_grace:

                        speech_grace[
                            mic_id
                        ] = time.time()

                    elif (

                        time.time()
                        -
                        speech_grace[
                            mic_id
                        ]

                        >

                        GRACE_PERIOD

                    ):

                        speech_start.pop(
                            mic_id,
                            None
                        )

                        speech_grace.pop(
                            mic_id,
                            None
                        )

                        alerted.pop(
                            mic_id,
                            None
                        )

        with sd.RawInputStream(

            samplerate=SAMPLE_RATE,
            blocksize=BLOCK_SIZE,
            channels=1,
            dtype='int16',
            callback=callback,
            device=DEVICE_INDEX

        ):

            print(
                "Listening..."
            )

            while True:

                time.sleep(
                    0.1
                )

    except KeyboardInterrupt:

        print()

        print(
            "Speech detection stopped"
        )