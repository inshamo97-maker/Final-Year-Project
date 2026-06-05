import numpy as np
import sounddevice as sd
import torch
import time
from datetime import datetime
from db import DB
from threading import Thread
from locks import db_lock
from microphone_loader import get_microphone_device
import os
import wave
import uuid

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

EVIDENCE_DIR = "evidence/audio_alerts"

speech_start = {}
speech_grace = {}
alerted = {}
last_alert_time = {}
audio_buffer = {}  # stores raw audio frames per mic

whisper_running = False


def should_alert(mic_id):
    return time.time() - last_alert_time.get(mic_id, 0) >= ALERT_COOLDOWN


def save_audio_evidence(mic_id):
    """Save buffered audio frames to a .wav file and return the path."""
    os.makedirs(EVIDENCE_DIR, exist_ok=True)

    frames = audio_buffer.get(mic_id, [])
    if not frames:
        return None

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"whisper_{mic_id}_{ts}.wav"
    path = os.path.join(EVIDENCE_DIR, filename)

    audio_data = np.concatenate(frames).astype(np.int16)

    with wave.open(path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # int16 = 2 bytes
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio_data.tobytes())

    print(f"[WHISPER] Audio evidence saved -> {path}")
    return path


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


def create_whisper_alert(hall_id, exam_id, mic_id):
    students = get_candidate_students(hall_id, exam_id)

    if not students:
        print("[WHISPER] No students found")
        return

    # Save audio evidence before inserting alert
    evidence_path = save_audio_evidence(mic_id)

    conn = DB.get_connection()
    cur = conn.cursor()
    now = datetime.now()

    try:
        for sid in students:
            event_id = str(uuid.uuid4())

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
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    event_id,
                    "whisper_detected",
                    0.80,
                    now,
                    hall_id,
                    str(exam_id),
                    str(sid),
                    None,
                    now
                ))

                # Save audio evidence path linked to this alert
                if evidence_path:
                    cur.execute("""
                        INSERT INTO alert_evidence (event_id, evidence_type, file_path)
                        VALUES (%s, %s, %s)
                    """, (event_id, "audio", evidence_path))

        conn.commit()
        print("[WHISPER] Alert + evidence inserted")

    finally:
        cur.close()


def audio_callback(indata, frames, time_info, status, hall_id, exam_id):

    audio = np.frombuffer(indata, dtype=np.int16).astype(np.float32) / 32768.0
    tensor = torch.tensor(audio)

    with torch.no_grad():
        confidence = model(tensor, SAMPLE_RATE).item()

    mic_id = "mic_0"
    is_speech = confidence > 0.5

    # Always buffer recent audio so we have it ready when alert fires
    if mic_id not in audio_buffer:
        audio_buffer[mic_id] = []
    audio_buffer[mic_id].append(np.frombuffer(indata, dtype=np.int16).copy())

    # Keep only last ~6 seconds of audio in buffer (avoid unbounded growth)
    max_frames = int((SAMPLE_RATE * 6) / BLOCK_SIZE)
    if len(audio_buffer[mic_id]) > max_frames:
        audio_buffer[mic_id] = audio_buffer[mic_id][-max_frames:]

    if is_speech:

        speech_grace.pop(mic_id, None)

        if mic_id not in speech_start:
            speech_start[mic_id] = time.time()
            alerted[mic_id] = False
            audio_buffer[mic_id] = []  # fresh buffer when speech starts

        duration = time.time() - speech_start[mic_id]

        if duration >= ALERT_DURATION and not alerted.get(mic_id):

            if should_alert(mic_id):
                create_whisper_alert(hall_id, exam_id, mic_id)
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
                audio_buffer.pop(mic_id, None)  # clear buffer after speech ends


def start_whisper_detection(hall_id=1, exam_id=1):

    global whisper_running

    session_key = (hall_id, exam_id)
    active_whisper_sessions[session_key] = True

    if whisper_running:
        print(f"[WHISPER] Stream already active, session {session_key} registered")
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
        if not any(active_whisper_sessions.values()):
            whisper_running = False
            print("[WHISPER] All sessions ended, stream released")
        else:
            print("[WHISPER] Session ended, other sessions still active")


def stop_whisper_detection(hall_id, exam_id):
    global whisper_running

    session_key = (hall_id, exam_id)
    active_whisper_sessions[session_key] = False

    if not any(active_whisper_sessions.values()):
        whisper_running = False

    print(f"[WHISPER] Stopped session {session_key}")


def detect_whisper(frame=None, hall_id=1, exam_id=1):

    Thread(
        target=start_whisper_detection,
        args=(hall_id, exam_id),
        daemon=True
    ).start()