# EYESON AI

**AI-powered exam monitoring and cheating detection system**

> Transferred my final year project from other account to here.

## Overview

EYESON AI is a real-time exam invigilation system that combines computer vision and audio analysis to detect potential cheating behavior during exams. It provides invigilators with live monitoring dashboards, automated alerts, and post-exam review tools.

## Features

- **Face Recognition & Attendance** — Automated student attendance verification using ArcFace-based face recognition (InsightFace)
- **Head Pose Estimation** — Real-time head pose tracking via MediaPipe and solvePnP to flag suspicious movement patterns
- **Voice Activity Detection** — Silero VAD integration to detect unauthorized talking during exams
- **Seating Verification** — DBSCAN clustering to verify students are seated in assigned/valid positions
- **Live Video Streaming** — MJPEG streaming pipeline for real-time invigilator monitoring
- **Alert System** — Automated flagging and logging of suspicious behavior for invigilator review
- **Role-based Access** — JWT-authenticated system with separate modules for invigilators, exams, halls, cameras, and alerts

## Tech Stack

**Frontend**
- React

**Backend**
- Node.js / Express
- PostgreSQL
- JWT Authentication

**AI / Computer Vision Layer**
- Python
- FastAPI
- InsightFace (face recognition)
- MediaPipe (head pose estimation)
- Silero VAD (voice activity detection)
- DBSCAN (seating pattern verification)

## System Architecture

The system is split into two main services:
1. A Node.js/Express backend handling authentication, exam/hall/camera management, and alert logging, backed by PostgreSQL.
2. A Python/FastAPI AI service handling face recognition, head pose estimation, voice activity detection, and seating verification, streaming processed video via MJPEG back to the invigilator dashboard.

## Project Status

Final Year Project (FYP) — completed and defended.

## Author

Inshaal — BSCS, University of Central Punjab (UCP)
Zainab Mir — BSCS, University of Central Punjab (UCP)
Arslan Khan — BSCS, University of Central Punjab (UCP)
