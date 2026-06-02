"""
Speaker Alert Module
=====================
Generates and plays a voice warning when a violation is detected.
Uses gTTS (online) with pyttsx3 as offline fallback.

Usage:
    python speaker_alert.py --roll l1f22bscs0339 --reason "please move to your correct seat"
    python speaker_alert.py --roll l1f22bscs0339 --reason "cheating detected"
    python speaker_alert.py --roll l1f22bscs0339  # uses default message

Install:
    pip install gtts pygame pyttsx3
"""

import argparse
import os
import time
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────────
AUDIO_DIR    = "evidence/audio_alerts"
USE_ONLINE   = True   # set False to force offline pyttsx3


# ── Online TTS (gTTS) ─────────────────────────────────────────────────────────

def speak_online(text, output_path):
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang="en", slow=False)
        tts.save(output_path)
        return True
    except Exception as e:
        print(f"[WARN] gTTS failed: {e} — falling back to offline")
        return False


# ── Offline TTS (pyttsx3) ─────────────────────────────────────────────────────

def speak_offline(text):
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty("rate", 150)    # speaking speed
        engine.setProperty("volume", 1.0)  # max volume
        engine.say(text)
        engine.runAndWait()
        return True
    except Exception as e:
        print(f"[ERROR] pyttsx3 failed: {e}")
        return False


# ── Play audio file ───────────────────────────────────────────────────────────

def play_audio(path):
    try:
        import pygame
        pygame.mixer.init()
        pygame.mixer.music.load(path)
        pygame.mixer.music.play()
        # wait for playback to finish
        while pygame.mixer.music.get_busy():
            time.sleep(0.1)
        pygame.mixer.quit()
    except Exception as e:
        print(f"[ERROR] pygame playback failed: {e}")


# ── Main alert function (call this from other modules later) ──────────────────

def trigger_alert(roll_number, reason="please move to your correct seat", exam_id="test"):
    """
    Generates and plays a voice alert for a student.
    This is the function other modules will call when wiring together.

    Args:
        roll_number : student registration number e.g. 'l1f22bscs0339'
        reason      : what the student did / instruction
        exam_id     : for naming the saved audio file
    
    Returns:
        path to saved audio file (for evidence logging later)
    """
    # build the spoken message
    # roll number read letter by letter sounds better e.g. "L 1 F 2 2 B S C S 0 3 3 9"
    spaced_roll = " ".join(roll_number.upper())
    message     = f"Attention. Roll number {spaced_roll}. {reason}."

    print(f"\n[SPEAKER] {message}")

    os.makedirs(AUDIO_DIR, exist_ok=True)
    ts        = datetime.now().strftime("%Y%m%d_%H%M%S")
    audio_path = os.path.join(AUDIO_DIR, f"alert_{roll_number}_{ts}.mp3")

    played = False

    if USE_ONLINE:
        success = speak_online(message, audio_path)
        if success:
            print(f"[SPEAKER] Playing audio → {audio_path}")
            play_audio(audio_path)
            played = True

    if not played:
        # fallback: offline TTS (no file saved, plays directly)
        print("[SPEAKER] Using offline TTS...")
        speak_offline(message)
        audio_path = None

    return audio_path


# ── CLI entry point ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="EYESON Speaker Alert")
    parser.add_argument("--roll",   required=True,
                        help="Student roll number e.g. l1f22bscs0339")
    parser.add_argument("--reason", default="please move to your correct seat",
                        help="Reason / instruction to speak")
    parser.add_argument("--exam-id", default="test",
                        help="Exam ID for file naming")
    parser.add_argument("--offline", action="store_true",
                        help="Force offline TTS (pyttsx3)")
    args = parser.parse_args()

    global USE_ONLINE
    if args.offline:
        USE_ONLINE = False

    path = trigger_alert(args.roll, args.reason, args.exam_id)

    if path:
        print(f"[DONE] Audio saved → {path}")
    else:
        print("[DONE] Alert played (offline, no file saved)")


if __name__ == "__main__":
    main()