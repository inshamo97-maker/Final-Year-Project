import argparse
import threading
from datetime import datetime
import os

# ── Config ─────────────────────────────────────
USE_ONLINE = False  # we disable gTTS completely for stability


# ── SINGLE AUDIO ENGINE (ONLY THIS) ───────────
def speak(text):
    try:
        import pyttsx3

        engine = pyttsx3.init()
        engine.setProperty("rate", 150)
        engine.setProperty("volume", 1.0)

        engine.say(text)
        engine.runAndWait()

        return True

    except Exception as e:
        print(f"[AUDIO ERROR] {e}")
        return False


# ── MAIN ALERT FUNCTION ────────────────────────
def trigger_alert(roll_number, reason="please move to your correct seat", exam_id="test"):

    if roll_number == "SYSTEM":
        message = f"Attention. {reason}"
    else:
        spaced_roll = " ".join(roll_number.upper())
        message = f"Attention. Roll number {spaced_roll}. {reason}."

    print(f"\n[SPEAKER] {message}")

    # run in background thread so EMS never blocks
    threading.Thread(target=speak, args=(message,), daemon=True).start()

    return None


# ── CLI ────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--roll", required=True)
    parser.add_argument("--reason", default="please move to your correct seat")
    parser.add_argument("--exam-id", default="test")

    args = parser.parse_args()

    trigger_alert(args.roll, args.reason, args.exam_id)


if __name__ == "__main__":
    main()