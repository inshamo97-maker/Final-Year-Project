import numpy as np
import sounddevice as sd
import torch
import time
from datetime import datetime
from db import DB
from threading import Thread
from locks import db_lock
from microphone_loader import get_microphone_device
active_whisper_sessions = {}
print("Loading Silero VAD...")

model, utils = torch.hub.load(
    repo_or_dir='snakers4/silero-vad',
    model='silero_vad',
    force_reload=False
)

SAMPLE_RATE = 16000
BLOCK_SIZE = 512

ALERT_DURATION = 2.0
GRACE_PERIOD = 1.0
ALERT_COOLDOWN = 30

speech_start = {}
speech_grace = {}
alerted = {}
last_alert_time = {}

whisper_running = False


# ----------------------------
# ALERT CONTROL
# ----------------------------
def should_alert(mic_id):
    return time.time() - last_alert_time.get(mic_id, 0) >= ALERT_COOLDOWN


# ----------------------------
# STUDENTS
# ----------------------------
def get_candidate_students(hall_id, exam_id):
    conn = DB.get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT student_id
            FROM seat_allocations
            WHERE hall_id=%s AND exam_id=%s
        """, (hall_id, exam_id))

        return [row[0] for row in cur.fetchall()]

    finally:
        cur.close()


# ----------------------------
# ALERT CREATION
# ----------------------------
def create_whisper_alert(hall_id, exam_id):
    students = get_candidate_students(hall_id, exam_id)

    if not students:
        print("[WHISPER] No students found")
        return

    conn = DB.get_connection()
    cur = conn.cursor()
    now = datetime.now()

    try:
        for sid in students:
            with db_lock:
                cur.execute("""
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
                    (gen_random_uuid(), %s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    "whisper_detected",
                    0.80,
                    now,
                    hall_id,
                    str(exam_id),
                    str(sid),
                    None,
                    now
                ))

        conn.commit()
        print("[WHISPER] Alert inserted")

    finally:
        cur.close()


# ----------------------------
# AUDIO CALLBACK
# ----------------------------
def audio_callback(indata, frames, time_info, status, hall_id, exam_id):

    audio = np.frombuffer(indata, dtype=np.int16).astype(np.float32) / 32768.0
    tensor = torch.tensor(audio)

    with torch.no_grad():
        confidence = model(tensor, SAMPLE_RATE).item()

    mic_id = "mic_0"
    is_speech = confidence > 0.5

    if is_speech:

        speech_grace.pop(mic_id, None)

        if mic_id not in speech_start:
            speech_start[mic_id] = time.time()
            alerted[mic_id] = False

        duration = time.time() - speech_start[mic_id]

        if duration >= ALERT_DURATION and not alerted.get(mic_id):

            if should_alert(mic_id):
                create_whisper_alert(hall_id, exam_id)
                last_alert_time[mic_id] = time.time()

            alerted[mic_id] = True

    else:
        if mic_id in speech_start:
            if mic_id not in speech_grace:
                speech_grace[mic_id] = time.time()
            elif time.time() - speech_grace[mic_id] > GRACE_PERIOD:
                speech_start.pop(mic_id, None)
                speech_grace.pop(mic_id, None)
                alerted.pop(mic_id, None)


# ----------------------------
# ENGINE START
# ----------------------------
def start_whisper_detection(hall_id=1, exam_id=1):

    global whisper_running
    session_key = (hall_id, exam_id)
    active_whisper_sessions[session_key] = True
    if whisper_running:
        return

    device = get_microphone_device(hall_id)

    if not device:
        print("[WHISPER] No microphone")
        return

    whisper_running = True

    print(f"[WHISPER] Device: {device}")

    def callback(indata, frames, time_info, status):
        audio_callback(indata, frames, time_info, status, hall_id, exam_id)

    try:

        if device["type"] == "local":

            with sd.RawInputStream(
                samplerate=SAMPLE_RATE,
                blocksize=BLOCK_SIZE,
                channels=1,
                dtype='int16',
                callback=callback,
                device=device["source"]
            ):
                while active_whisper_sessions.get(session_key, False):
                    time.sleep(0.1)

        elif device["type"] == "ip":
            print("[WHISPER] IP mic not implemented yet:", device["source"])

        else:
            print("[WHISPER] Unknown device type")

    finally:
        whisper_running = False

def stop_whisper_detection(hall_id, exam_id):
    session_key = (hall_id, exam_id)

    active_whisper_sessions[session_key] = False

    print(f"[WHISPER] Stopped session {session_key}")
# ----------------------------
# SAFE WRAPPER
# ----------------------------
def detect_whisper(frame=None, hall_id=1, exam_id=1):

    Thread(
        target=start_whisper_detection,
        args=(hall_id, exam_id),
        daemon=True
    ).start()