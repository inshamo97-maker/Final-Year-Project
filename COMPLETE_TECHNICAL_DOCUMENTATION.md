# EYESON Exam Monitoring System - Complete Technical Documentation

---

## 1. Project Overview

**Project Name:** EYESON AI-Powered Exam Monitoring System

**Purpose:** An intelligent exam proctoring and monitoring system that uses AI-powered computer vision and audio analysis to detect cheating, verify student attendance, monitor seating arrangements, and alert invigilators (exam supervisors) in real-time.

**System Type:** Multi-tier web application with embedded AI/ML components

**Key Users:**
- **Admins**: Manage the entire system (exams, invigilators, hardware, students, reports)
- **Invigilators**: Supervisors who monitor exams in real-time and respond to AI-detected violations

---

## 2. Technology Stack

### **Frontend**
- **Framework**: React 18 (with TypeScript)
- **Build Tool**: Vite
- **State Management**: React Query (@tanstack/react-query)
- **UI Components**: shadcn/ui (Radix UI-based component library)
- **Styling**: Tailwind CSS + PostCSS
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **Real-time Communication**: Socket.IO client
- **Notifications**: Sonner (toast notifications)
- **Package Manager**: Bun

### **Backend (Node.js/Express)**
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Database**: PostgreSQL with pg driver
- **Authentication**: JWT (jsonwebtoken) + bcryptjs password hashing
- **Real-time Events**: Socket.IO 4.8.1
- **API Validation**: Zod 4.4.2
- **File Upload**: Multer 2.1.1
- **CSV Parsing**: csv-parser 3.2.0
- **Development**: Nodemon for auto-restart
- **Port**: 5000 (default)

### **AI/ML Engine (Python)**
- **Framework**: FastAPI
- **Computer Vision**: 
  - OpenCV 2 (video processing)
  - InsightFace (face detection, recognition, embedding)
  - MediaPipe (facial landmarks, face mesh analysis)
- **Audio Processing**: 
  - SoundDevice (microphone capture)
  - Silero VAD (Voice Activity Detection using PyTorch)
- **Speech Recognition**: OpenAI Whisper (whisper detection)
- **Text-to-Speech**: pyttsx3 (alert announcements)
- **Database**: psycopg2 (PostgreSQL)
- **Server**: uvicorn ASGI server
- **Port**: 8000 (default)
- **Real-time**: Socket.IO for Python
- **Video Streaming**: MJPEG streaming endpoint

### **Database**
- **DBMS**: PostgreSQL
- **Tables**:
  - `users` - Admins and invigilators
  - `students` - Student records
  - `exams` - Exam schedules
  - `exam_halls` - Physical exam locations
  - `cameras`, `microphones`, `speakers` - Hardware devices
  - `violations` - Detected cheating violations
  - `ai_alerts` - Raw AI detections
  - `alerts` - System alerts
  - `attendance` - Student attendance records
  - `student_embeddings` - Face embeddings for recognition
  - `seat_allocations` - Student seating arrangements
  - `invigilator_halls` - Assignment of invigilators to halls

### **Communication Protocols**
- **REST API** (HTTP/HTTPS) - Backend API endpoints
- **WebSocket** (Socket.IO) - Real-time event distribution
- **MJPEG Streaming** (HTTP) - Live video feed from Python
- **Server-Sent Events** (Socket.IO) - Alert notifications

---

## 3. Folder/File Structure Summary

```
FULL Project/
├── ai/                                # Python AI Engine
│   ├── main.py                        # Core exam worker loop (video processing)
│   ├── api_server.py                  # FastAPI server + streaming endpoints
│   ├── config.py                      # Configuration loader (.env)
│   ├── db.py                          # Database connection manager
│   ├── orchestrator.py                # Exam scheduler
│   ├── exam_controller.py             # Exam start/stop control
│   ├── attendance.py                  # Face recognition + attendance marking
│   ├── recognition.py                 # InsightFace model loader
│   ├── load_embeddings.py             # Load student face embeddings from DB
│   ├── create_embeddings.py           # Generate embeddings from photos
│   ├── seating.py                     # Verify student seating arrangement
│   ├── cheating.py                    # Head pose analysis + cheating detection
│   ├── whisper_detector.py            # Speech detection + whisper alerts
│   ├── whisper_gate.py                # Determine if whisper detection should run
│   ├── microphone_loader.py           # Microphone device loader
│   ├── camera_loader.py               # Camera source loader
│   ├── frame_broadcaster.py           # Frame buffer for video streaming
│   ├── speaker_alert.py               # Text-to-speech alert generation
│   ├── speaker_loader.py              # Speaker device loader
│   ├── runtime_state.py               # Global state dict (exam_running)
│   ├── locks.py                       # Threading locks for DB access
│   ├── worker.py                      # Main worker for exam processing
│   ├── requirements.txt               # Python dependencies
│   └── evidence/                      # Stored evidence images/audio
│       ├── images/
│       │   ├── attendance/
│       │   ├── cheating/
│       │   ├── seating/
│       │   └── unknown_faces/
│       └── audio_alerts/
│
├── Backend/backend/                   # Node.js Express Backend
│   ├── src/
│   │   ├── server.js                  # Express app + Socket.IO setup
│   │   ├── db.js                      # PostgreSQL pool configuration
│   │   ├── passwordhasher.js          # Password hashing utility
│   │   ├── controllers/               # Business logic
│   │   │   ├── authController.js      # Login + JWT issuance
│   │   │   ├── studentController.js   # Student CRUD + CSV upload
│   │   │   ├── examController.js      # Exam CRUD + status auto-update
│   │   │   ├── examHallController.js  # Exam hall management
│   │   │   ├── invigilatorController.js # Invigilator CRUD
│   │   │   ├── violationController.js # Violation CRUD
│   │   │   ├── alertController.js     # AI alert management + violation creation
│   │   │   ├── aiController.js        # AI ingestion endpoints
│   │   │   ├── cameraController.js    # Camera device management
│   │   │   ├── microphoneController.js # Microphone device management
│   │   │   ├── speakerController.js   # Speaker device management
│   │   │   ├── seatAllocationController.js # Seating assignment
│   │   │   ├── seatingController.js   # Seating verification
│   │   │   ├── deviceMapController.js # Device role assignment
│   │   │   ├── reportController.js    # Report generation
│   │   │   └── [other controllers]
│   │   ├── routes/                    # API route definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── studentRoutes.js
│   │   │   ├── examRoutes.js
│   │   │   ├── violationRoutes.js
│   │   │   ├── aiRoutes.js
│   │   │   ├── deviceMapRoutes.js
│   │   │   └── [other route files]
│   │   ├── middleware/                # Request/response middleware
│   │   │   ├── authMiddleware.js      # JWT verification
│   │   │   ├── roleMiddleware.js      # Admin-only access control
│   │   │   ├── aiAuth.js              # AI endpoint auth (JWT or x-ai-key)
│   │   │   ├── asyncHandler.js        # Async error wrapper
│   │   │   └── errorHandler.js        # Global error handler
│   │   ├── services/                  # Business logic services
│   │   │   ├── violationEngine.js     # Create violations from AI events
│   │   │   └── deviceMapService.js    # Device role assignment logic
│   │   ├── models/                    # Database models/schemas
│   │   │   ├── userModel.js
│   │   │   ├── studentModel.js
│   │   │   ├── alertModel.js
│   │   │   └── [other models]
│   │   ├── validation/                # Input validation schemas (Zod)
│   │   │   └── aiSchemas.js
│   │   ├── utils/                     # Helper functions
│   │   │   ├── hallScope.js           # Hall-based access filtering
│   │   │   ├── password.js            # Password verification
│   │   │   └── response.js            # Response formatting
│   │   ├── scripts/                   # Database migration/setup scripts
│   │   └── uploads/                   # File upload directory (CSV)
│   ├── package.json
│   └── .env                           # Database + config secrets
│
├── Frontend/fyp-frontend/             # React TypeScript Frontend
│   ├── src/
│   │   ├── main.jsx                   # React entry point
│   │   ├── App.jsx                    # Route definitions
│   │   ├── pages/
│   │   │   ├── Login.jsx              # Login page
│   │   │   ├── NotFound.jsx           # 404 page
│   │   │   ├── admin/                 # Admin pages
│   │   │   │   ├── AdminOverview.jsx  # Dashboard
│   │   │   │   ├── AdminExamSchedule.jsx
│   │   │   │   ├── AdminInvigilators.jsx
│   │   │   │   ├── AdminStudents.jsx
│   │   │   │   ├── AdminHardware.jsx  # Cameras, mics, speakers
│   │   │   │   ├── AdminSeating.jsx
│   │   │   │   ├── AdminViolations.jsx
│   │   │   │   ├── AdminAlerts.jsx
│   │   │   │   └── AdminReports.jsx
│   │   │   └── invigilator/           # Invigilator pages
│   │   │       ├── InvigilatorDashboard.jsx
│   │   │       ├── InvigilatorAlerts.jsx
│   │   │       ├── InvigilatorViolations.jsx
│   │   │       ├── InvigilatorExamHalls.jsx
│   │   │       └── InvigilatorStudents.jsx
│   │   ├── components/                # Reusable components
│   │   │   ├── layout/                # Layout components
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── LiveCamera.jsx         # Video stream viewer
│   │   │   ├── RealTimeAlertsPanel.jsx # Real-time alert display
│   │   │   └── [other components]
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── services/                  # API client services
│   │   ├── lib/                       # Utilities (API client, etc)
│   │   ├── index.css                  # Global styles
│   │   └── vite-env.d.ts              # Vite type definitions
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── eslint.config.js
│
├── photos/                            # Student photo directory
│   └── photosHome/                    # Photos for embedding generation
│
└── COMPLETE_TECHNICAL_DOCUMENTATION.md (this file)
```

---

## 4. File-by-File Breakdown

### **AI Engine Files**

#### **main.py** - Core Exam Worker
- **Purpose**: Main worker thread that processes exam video frames in real-time
- **Key Functions**:
  - `run_exam_worker(EXAM_ID, HALL_ID)` - Main loop that:
    1. Opens camera feed for a hall
    2. Marks initial attendance using face recognition
    3. Verifies seating arrangement
    4. Starts whisper (speech) detection if enabled
    5. Continuously processes frames for cheating detection
    6. Broadcasts frames to `/stream/{hall_id}` endpoint
    7. Periodically marks absent students (after 30 min)
- **Connects To**: 
  - `attendance.py` → marks students present
  - `seating.py` → verifies student positions
  - `cheating.py` → detects head position violations
  - `whisper_detector.py` → detects unauthorized speech
  - `camera_loader.py` → gets video source
  - `frame_broadcaster.py` → sends video to streaming endpoint

#### **api_server.py** - FastAPI Server
- **Purpose**: Exposes Python engine as HTTP/WebSocket service
- **Endpoints**:
  - `GET /scheduler/status` - Returns scheduler state
  - `GET /exam/start/{exam_id}/{hall_id}` - Manually start exam worker
  - `GET /exam/stop/{exam_id}/{hall_id}` - Manually stop exam worker
  - `GET /stream/{hall_id}` - MJPEG video stream (multipart/x-mixed-replace)
- **Middleware**:
  - CORS enabled for all origins
  - Socket.IO integration for real-time events
- **Startup/Shutdown**:
  - On startup: calls `start_scheduler()` to begin monitoring exam schedule
  - On shutdown: calls `stop_scheduler()` to cleanup

#### **orchestrator.py** - Exam Scheduler
- **Purpose**: Monitors database for upcoming/running exams and auto-starts/stops workers
- **Key Functions**:
  - `scheduler_loop()` - Runs in background thread, checks every 5 seconds:
    - **For pending exams**: Sends alerts 5 minutes and 1 minute before start
    - **At exam start time**: Updates exam status to 'running', starts exam worker
    - **At exam end time**: Stops exam worker, updates status to 'completed'
  - `get_pending_exams()` - Queries DB for scheduled exams
  - `get_running_exams()` - Queries DB for active exams
  - `start_scheduler()` - Launches scheduler thread
  - `stop_scheduler()` - Gracefully stops scheduler
- **Connects To**: 
  - Database via `db.py`
  - `exam_controller.py` → starts/stops workers
  - `speaker_alert.py` → sends audio alerts to supervisor

#### **attendance.py** - Face Recognition & Attendance
- **Purpose**: Detects student faces and marks them as present
- **Key Functions**:
  - `mark_attendance(HALL_ID, EXAM_ID, frame, absent_only=False)` - Main entry:
    1. Extracts faces from frame using InsightFace
    2. Compares face embeddings against loaded student embeddings
    3. Records attendance in database
    4. Returns list of recognized students with confidence
  - `get_absent_students(exam_id, hall_id)` - Queries DB for students not yet marked present
  - `notify_express_attendance()` - Sends Socket.IO event to backend for frontend update
  - `save_attendance_evidence()` - Saves snapshot image as proof
  - `save_unknown_snapshot()` - Saves unrecognized faces for review
- **Uses**:
  - `recognition.py` → FaceAnalysis model from InsightFace
  - `load_embeddings.py` → loads known student face vectors from DB
- **Connects To**:
  - API backend to notify of attendance changes

#### **seating.py** - Seating Verification
- **Purpose**: Verifies students are sitting in their assigned seats
- **Key Functions**:
  - `verify_seating(attendance_results, frame, hall_id, exam_id)` - Main function:
    1. Queries seat_allocations table for expected student positions
    2. Converts frame into grid based on rows/columns
    3. For each detected student, calculates center position
    4. Compares actual vs expected grid position
    5. Creates violation if student is in wrong seat
  - `save_seating_evidence()` - Saves image of student in wrong seat
  - Alert cooldown prevents spam alerts
- **Connects To**:
  - `speaker_alert.py` → announces wrong seat to supervisor
  - Database → stores violations

#### **cheating.py** - Head Pose & Cheating Detection
- **Purpose**: Analyzes student head position and gaze direction to detect cheating
- **Key Functions**:
  - `detect_cheating(frame, HALL_ID, EXAM_ID)` - Main loop:
    1. Uses MediaPipe FaceMesh to extract facial landmarks (468 points)
    2. Calculates head yaw (left-right) and pitch (up-down) angles
    3. Compares against thresholds (YAW_THRESHOLD=18°, PITCH_THRESHOLD=18°)
    4. If student looks away >18° for >3 seconds: creates violation
    5. Applies alert cooldown (3 seconds between alerts)
  - `save_cheating_snapshot()` - Saves evidence image
  - `get_student_name()` - Cached lookup of student names from DB
- **Thresholds**:
  - YAW_THRESHOLD: 18° (looking left/right)
  - PITCH_THRESHOLD: 18° (looking up/down)
  - CHEAT_TIME: 3 seconds (must maintain violation for 3s to alert)
  - ALERT_COOLDOWN: 3 seconds (wait before next alert)
- **Connects To**:
  - Database → retrieves student info, stores violations

#### **whisper_detector.py** - Speech Detection
- **Purpose**: Detects unauthorized speaking/whispering during exam
- **Key Functions**:
  - `detect_whisper(hall_id, exam_id)` - Main function:
    1. Captures audio from microphone using sounddevice
    2. Uses Silero VAD model to detect voice activity (16kHz sample rate)
    3. When speech starts: begins timing
    4. When speech continues >2 seconds (ALERT_DURATION): sends alert
    5. Grace period (1 second) prevents false positives from coughs, etc
    6. Alert cooldown (30 seconds) prevents spam
  - `create_whisper_alert()` - Creates violation for unauthorized speech
  - `get_candidate_students()` - Gets seated students who could be speaking
  - `should_alert()` - Checks if enough time has passed since last alert
- **Thresholds**:
  - Sample rate: 16kHz
  - Alert duration: 2 seconds of speech
  - Grace period: 1 second
  - Alert cooldown: 30 seconds
- **Uses**: Silero VAD PyTorch model for voice detection

#### **whisper_gate.py** - Whisper Detection Control
- **Purpose**: Determines if whisper detection should be enabled for a hall
- **Note**: File exists but logic not shown - likely checks hall configuration

#### **recognition.py** - Face Model Loader
- **Purpose**: Loads and initializes InsightFace FaceAnalysis model
- **Code**:
  ```python
  app = FaceAnalysis(name='buffalo_s')
  app.prepare(ctx_id=-1, det_size=(320,320))
  ```
- **Uses**: InsightFace buffalo_s model for face detection and embedding extraction
- **Config**: ctx_id=-1 uses CPU (not GPU)

#### **load_embeddings.py** - Student Embedding Loader
- **Purpose**: Loads all student face embeddings from database into memory
- **Key Function**:
  - `load_students()` - Returns:
    - `student_ids[]` - List of student IDs
    - `student_names[]` - Corresponding student names
    - `embeddings[]` - Numpy arrays of face vectors (for comparison)
- **Uses**: Database query with JOIN on student_embeddings table
- **Called By**: `attendance.py` during startup to pre-load all embeddings

#### **create_embeddings.py** - Embedding Generation
- **Purpose**: Generates face embeddings from student photos and stores in database
- **Process**:
  1. Iterates through photos in `photos/` directory
  2. Extracts student registration number from filename
  3. Uses InsightFace to detect face and generate embedding vector
  4. Inserts/updates embedding in `student_embeddings` table
  5. Saves unknown/missing faces separately
- **Note**: Run once during setup to populate embeddings database

#### **camera_loader.py** - Camera Device Loader
- **Purpose**: Gets camera source (IP address or webcam index) for a hall
- **Key Function**:
  - `get_camera_source(hall_id)` - Queries cameras table for hall
  - Supports: IP cameras (rtsp://...) or local webcam indices (0, 1, etc)
  - Returns: IP address or index (0 = default webcam)
- **Uses**: OpenCV's VideoCapture which accepts both formats

#### **microphone_loader.py** - Microphone Device Loader
- **Purpose**: Gets microphone source for a hall
- **Returns**: 
  ```python
  {
    "type": "local" | "ip",
    "source": int | str
  }
  ```
- **Supports**: Local device index or IP-based microphone

#### **speaker_loader.py** - Speaker Device Loader
- **Purpose**: Gets speaker configuration for a hall
- **Note**: Likely similar to camera/microphone loaders

#### **frame_broadcaster.py** - Frame Buffer
- **Purpose**: Thread-safe buffer for sharing video frames between exam worker and streaming endpoint
- **Key Functions**:
  - `push_frame(hall_id, frame)` - Worker thread writes latest frame
  - `get_frame(hall_id)` - Streaming endpoint reads latest frame
  - `release(hall_id)` - Cleanup buffer when exam ends
- **Thread Safety**: Uses locks to prevent race conditions

#### **speaker_alert.py** - Audio Alert System
- **Purpose**: Announces alerts to exam supervisor using text-to-speech
- **Key Function**:
  - `trigger_alert(roll_number, reason, exam_id)` - Speaks message:
    - For roll numbers: "Attention. Roll number A B C D. [reason]."
    - For system: "Attention. [reason]."
  - Runs in background thread (non-blocking)
- **Uses**: pyttsx3 for text-to-speech (offline)
- **Disabled**: gTTS (online speech) is disabled for stability

#### **exam_controller.py** - Exam Thread Control
- **Purpose**: Manages exam worker threads
- **Functions**:
  - `start_exam_worker(exam_id, hall_id)` - Creates + starts worker thread
  - `stop_exam_worker(exam_id, hall_id)` - Signals worker to stop
  - `is_running(exam_id, hall_id)` - Checks if exam is active
- **Thread Management**: Uses Python threading.Thread with daemon=True

#### **db.py** - Database Connection
- **Purpose**: PostgreSQL connection manager with connection pooling
- **Key Function**:
  - `DB.get_connection()` - Returns persistent connection, creates if needed
  - Singleton pattern: reuses connection across calls
  - Error handling: prints connection errors, returns None on failure
- **Uses**: psycopg2 driver

#### **config.py** - Configuration Loader
- **Purpose**: Loads environment variables from `.env` file
- **Loads**:
  ```python
  DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT")),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD")
  }
  ```

#### **runtime_state.py** - Global State
- **Purpose**: Tracks which exams are currently running
- **Data Structure**:
  ```python
  exam_running = {}  # {(exam_id, hall_id): True/False}
  ```
- **Thread Safety**: Protected by locks in orchestrator

#### **locks.py** - Threading Locks
- **Purpose**: Database access synchronization
- **Exports**:
  - `db_lock` - Used by all code accessing PostgreSQL

#### **requirements.txt** - Python Dependencies
- Core: opencv-python, numpy
- AI/ML: insightface, mediapy, torch, silero-vad
- Audio: sounddevice, pyttsx3
- Web: fastapi, uvicorn, socketio
- Database: psycopg2
- Utilities: dotenv, requests

---

### **Backend (Node.js/Express) Files**

#### **server.js** - Express Application
- **Purpose**: Main Express.js server with Socket.IO integration
- **Initialization**:
  1. Creates HTTP server
  2. Initializes Socket.IO with CORS
  3. Sets up PostgreSQL connection pool
  4. Creates AI tables if they don't exist (ai_alerts, attendance, student_embeddings)
- **Middleware Stack**:
  - CORS enabled
  - Body parser (JSON)
  - Error handler
- **Routes**: Mounts all 16 route files
- **Socket.IO Events**:
  - `ai-alert` - Emitted when AI detects anomaly
  - `attendance` - Emitted when student marked present
  - Event scoping: `hall:${hallId}` rooms for hall-specific events
- **Startup**: Listens on port 5000

#### **db.js** - PostgreSQL Pool
- **Purpose**: Creates and exports pg connection pool
- **Configuration**:
  ```javascript
  {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT
  }
  ```
- **Used By**: All controllers to query database

#### **authController.js** - Authentication
- **Login Function**: 
  1. Queries users table by email
  2. Verifies password (bcrypt hash or plaintext fallback)
  3. If invigilator: fetches assigned halls from invigilator_halls table
  4. Issues JWT token (1-hour expiry) with payload:
     ```javascript
     {
       id: user.id,
       role: "admin" | "invigilator",
       isAdmin: boolean,
       hallIds: [array of hall IDs for invigilators]
     }
     ```
  5. Returns token + user info
- **JWT Secret**: "your_jwt_secret" (hardcoded - security issue noted)

#### **studentController.js** - Student Management
- **GET /api/students**:
  - Invigilators: Get students assigned to their halls with active/scheduled exams
  - Admins: Get all students
  - Returns: name, registration_number, hall_id, seating (row/column), exam_id
- **POST /api/students/upload/csv**: Bulk import student records

#### **examController.js** - Exam Management
- **Key Functions**:
  - `getAllExams()` - List exams, filtered by hall scope
  - `getExamById()` - Get specific exam details
  - `createExam()` - Create manual exam
  - `updateExamStatus()` - Change exam status (scheduled/active/ended)
  - `autoUpdateStatuses()` - Auto-transition based on current time
  - `uploadExamsCSV()` - Bulk import exams
- **Status Transitions**:
  - scheduled → active (when current time ≥ start_time)
  - active → ended (when current time ≥ end_time)
- **Hall Scope**: Invigilators can only see exams in their assigned halls

#### **violationController.js** - Violation Management
- **Violations**: Records of confirmed or suspected cheating
- **Statuses**: pending | confirmed | dismissed
- **Functions**:
  - `getAllViolations()` - List with hall-based filtering
  - `getViolationById()` - Get violation details
  - `createViolation()` - Manually create violation record
  - `updateViolationStatus()` - Change status (e.g., invigilator confirms/dismisses)
  - `deleteViolation()` - Remove violation (admin only)
- **Fields**: type, evidence_path, confidence, hall_id, student_id, timestamp

#### **alertController.js** - AI Alert Management
- **Key Feature**: When invigilator confirms alert → creates violation via violationEngine
- **Functions**:
  - `getAllAlerts()` - List AI-detected events
  - `getAlertById()` - Specific alert with violation details
  - `createAlert()` - Manual alert creation
  - `updateAlertStatus()` - Change status:
    - pending → confirmed: triggers violation creation
    - → dismissed: ignores the alert
- **Note**: AI alerts are separate from violations; confirmation creates the violation

#### **aiController.js** - AI Ingestion Endpoints
- **POST /api/ai-alert** - Receive raw AI detection:
  - Body: event_id, type, confidence, timestamp, hall_id, student_id, exam_id
  - Validation: Uses Zod schema
  - Action: Stores in ai_alerts table, emits Socket.IO event to hall
- **POST /api/attendance** - Receive attendance event:
  - Body: event_id, type, confidence, timestamp, hall_id, student_id, exam_id
  - Action: Python already wrote to DB; backend only fires Socket.IO event for frontend
- **POST /api/student-embeddings** - Receive/upsert face embedding:
  - Body: event_id, student_id, embedding (JSONB array)
- **GET /api/ai-alerts** - List all AI alerts
- **GET /api/attendance** - List all attendance records
- **Authorization**: JWT token OR x-ai-key header (for Python)
- **Event Broadcast**: Socket.IO to `hall:${hallId}` room

#### **violationEngine.js** - Violation Creator
- **Purpose**: Converts AI alerts into violation records
- **Key Function**: `createViolationAndAlertFromAiEvent()`
- **Severity Calculation**:
  - High: impersonation, phone use, multiple students (or confidence ≥0.9)
  - Medium: head position, gaze direction (or confidence ≥0.7 with high base)
  - Low: others
- **Initial Status**:
  - Confirmed: if severity=high AND confidence ≥0.9
  - Pending: otherwise (awaits human review)
- **Fields Written**: type, confidence, hall_id, student_id, status, timestamp, severity (if column exists)

#### **deviceMapService.js** - Device Role Assignment
- **Purpose**: Backend determines functional role of each physical device
- **Camera Roles**:
  - "front" position → attendance_camera
  - "back" position → cheating_camera
  - "side" position → seating_camera
  - else → general_camera
- **Microphone Roles**:
  - sensitivity="high" → speech_detection_mic
  - row_number < 3 → front_audio_mic
  - else → general_mic
- **Speaker Roles**:
  - volume_level > 70 → alert_speaker
  - else → instruction_speaker
- **Function**: `getDeviceMapForHall(hallId)` returns organized device mapping
- **Design Philosophy**: Backend is single source of truth; AI clients consume this mapping

#### **deviceMapController.js** - Device Mapping Endpoint
- **GET /api/hall-device-map?hall_id=:id** (JWT required)
- Returns: Devices organized by role for a hall
- Used by AI system to understand device purposes

#### **authMiddleware.js** - JWT Verification
- **Authenticates** all requests with Authorization header
- **Verifies** JWT signature (secret: "your_jwt_secret")
- **Checks** user exists in DB (DB is source of truth)
- **Populates** req.user with: id, name, email, role, hallIds, isAdmin
- **Hall Scope**: Invigilators get their assigned hall IDs from invigilator_halls table

#### **roleMiddleware.js** - Admin Check
- **Function**: `isAdmin(req, res, next)`
- **Purpose**: Restricts routes to admins only
- **Returns**: 403 if user.isAdmin is falsy

#### **aiAuth.js** - AI Endpoint Authentication
- **Purpose**: Allows AI system to authenticate via x-ai-key header instead of JWT
- **Header**: `x-ai-key: eyeson-ai-key-2024`
- **Used On**: `/api/ai-alert`, `/api/attendance`, `/api/student-embeddings`

#### **asyncHandler.js** - Error Wrapper
- **Purpose**: Wraps async route handlers to catch errors
- **Pattern**: 
  ```javascript
  router.post('/endpoint', asyncHandler(async (req, res) => {...}))
  ```

#### **errorHandler.js** - Global Error Middleware
- **Purpose**: Catches all errors and returns consistent JSON response
- **Called Last** in middleware chain

---

### **Frontend (React) Files**

#### **App.jsx** - Main App Component
- **Purpose**: Route definitions using React Router v6
- **Query Client**: Initializes React Query for API state management
- **Route Structure**:
  - `/` → Login page
  - `/invigilator/*` → Invigilator routes (dashboard, alerts, violations, etc)
  - `/admin/*` → Admin routes (overview, schedule, hardware, students, etc)
- **Providers**:
  - QueryClientProvider (React Query)
  - TooltipProvider (Radix UI)
  - Toaster components (sonner + shadcn)

#### **pages/Login.jsx** - Authentication
- **Purpose**: User login interface
- **Functionality**: Accepts email/password, sends to `/api/auth/login`
- **Storage**: Saves JWT token to localStorage
- **Redirect**: Routes to dashboard based on role

#### **pages/admin/AdminOverview.jsx** - Admin Dashboard
- **Purpose**: System overview for administrators
- **Displays**: Statistics, active exams, recent violations, hardware status

#### **pages/admin/AdminExamSchedule.jsx** - Exam Management
- **Purpose**: Create, edit, delete exams and exam halls
- **Features**: 
  - Calendar view or table view of exams
  - Bulk CSV import
  - Status management (scheduled/active/ended)

#### **pages/admin/AdminHardware.jsx** - Device Management
- **Purpose**: Manage cameras, microphones, speakers
- **Features**:
  - Add/edit/delete devices
  - Assign devices to halls
  - Set device positions/roles
  - Bulk CSV import

#### **pages/admin/AdminSeating.jsx** - Seating Arrangement
- **Purpose**: Define student seat assignments per exam
- **Features**:
  - Visual grid layout
  - Drag-drop or form-based assignment
  - Bulk assignment options
  - Export/import seating plans

#### **pages/admin/AdminViolations.jsx** - Violation Review
- **Purpose**: Review and manage violation records
- **Features**:
  - List all violations with filtering
  - View violation evidence (images)
  - Update violation status (confirmed/dismissed)
  - Generate reports

#### **pages/invigilator/InvigilatorDashboard.jsx** - Invigilator View
- **Purpose**: Real-time exam monitoring interface
- **Features**:
  - Live video stream from hall camera
  - Real-time alerts panel
  - Student attendance list
  - Seating verification overlay
  - Quick violation confirmation buttons

#### **pages/invigilator/InvigilatorAlertsPage.jsx** - Alert Management
- **Purpose**: View and respond to AI alerts
- **Features**:
  - Real-time alert notifications (Socket.IO)
  - Alert details with confidence scores
  - Quick actions: confirm, dismiss, investigate

#### **components/LiveCamera.jsx** - Video Stream Viewer
- **Purpose**: Displays MJPEG stream from Python backend
- **Source**: `http://localhost:8000/stream/{hallId}`
- **Format**: Multipart/x-mixed-replace JPEG stream

#### **components/RealTimeAlertsPanel.jsx** - Alert Notifications
- **Purpose**: Socket.IO listener for real-time events
- **Listens To**:
  - `ai-alert` - New AI detection
  - `attendance` - Student marked present
  - `violation-confirmed` - Alert confirmed as violation
- **Updates**: Frontend UI live without page refresh

#### **services/** - API Client
- **Purpose**: Encapsulates backend API calls
- **Pattern**: Custom hooks using React Query
- **Example**:
  ```javascript
  useStudents(hallId) // GET /api/students
  useExams() // GET /api/exams
  useViolations() // GET /api/violations
  ```

#### **lib/** - Utilities
- **API Client**: Axios/fetch wrapper with JWT token injection
- **Auth Utils**: Token management, role checking
- **Constants**: API base URLs, default values

---

## 5. Data Flow & Architecture

### **High-Level System Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│  - Invigilator Dashboard                                            │
│  - Admin Management Panels                                          │
│  - Real-time Alert Panel (Socket.IO listener)                       │
│  - Live Video Stream Viewer                                         │
└────────────┬──────────────────────────────────────────────────────┬─┘
             │                                                        │
      ┌──────v──────┐                                    ┌───────────v──┐
      │  REST API   │                                    │  WebSocket   │
      │  (HTTP)     │                                    │  (Socket.IO) │
      │             │                                    │              │
      │ /api/*      │                                    │ Events: ai-  │
      │ endpoints   │                                    │ alert, etc   │
      └──────┬──────┘                                    └───────────┬──┘
             │                                                        │
             └─────────────────┬──────────────────────────────────┬──┘
                               │                                  │
                        ┌──────v──────────────────┐       ┌──────v──┐
                        │  BACKEND (Node.js       │       │ Python  │
                        │  Express.js)            │       │ FastAPI │
                        │                         │       │ Server  │
                        │ - Authentication        │       │         │
                        │ - CRUD operations       │       │ - AI    │
                        │ - Violation logic       │       │   Models│
                        │ - Device mapping        │       │ - Face  │
                        │ - Real-time events      │       │   Recog │
                        │ - DB queries            │       │ - Cheat │
                        │                         │       │   Detect│
                        └────────┬─────┬──────────┘       │ - Seating│
                                 │     │                  │   Verify│
                                 │     │                  │ - Speech│
                        ┌────────v─────v──────┐           │   Detect│
                        │  PostgreSQL         │           │ - Video │
                        │  Database           │           │   Stream│
                        │                     │           └────┬────┘
                        │ - users             │                │
                        │ - students          │         ┌──────v──────┐
                        │ - exams             │         │ Hardware    │
                        │ - violations        │         │ (Cameras,   │
                        │ - alerts            │         │ Mics,       │
                        │ - attendance        │         │ Speakers)   │
                        │ - embeddings        │         │             │
                        │ - seat allocations  │         └─────────────┘
                        │ - devices           │
                        └─────────────────────┘
```

### **Exam Execution Data Flow**

```
1. ADMIN SCHEDULING
   ├─ Admin creates exam (date, time, hall, students)
   │  └─ Stored in exams table
   └─ Admin assigns students to seats
      └─ Stored in seat_allocations table

2. ORCHESTRATOR MONITORING (Python scheduler runs 24/7)
   ├─ Every 5 seconds: checks DB for exams
   ├─ 5 min before start: sends audio alert "Exam starts in 5 minutes"
   ├─ 1 min before start: sends audio alert "Exam starts in 1 minute"
   ├─ At start time:
   │  ├─ Updates exam status → "running"
   │  └─ Calls start_exam_worker(exam_id, hall_id)
   └─ At end time:
      ├─ Stops exam worker
      └─ Updates exam status → "completed"

3. EXAM WORKER STARTUP
   ├─ Opens camera for hall
   ├─ Marks initial attendance:
   │  ├─ Captures frame
   │  ├─ Extracts faces using InsightFace
   │  ├─ Compares embeddings vs loaded student database
   │  ├─ Records attendance in attendance table
   │  └─ Notifies backend → Socket.IO "attendance" event
   ├─ Verifies seating:
   │  ├─ For each detected face, calculates position
   │  ├─ Queries seat_allocations for expected position
   │  ├─ Compares actual vs expected
   │  └─ Creates violation if mismatch
   └─ Optionally starts whisper detection

4. CONTINUOUS MONITORING (while exam_running)
   ├─ Loop: read frame every ~33ms (30 FPS)
   ├─ CHEATING DETECTION:
   │  ├─ Face mesh analysis (head pose)
   │  ├─ If yaw/pitch > thresholds > 3 seconds:
   │  │  ├─ Creates violation in DB
   │  │  ├─ Sends POST /api/ai-alert to backend
   │  │  └─ Backend broadcasts Socket.IO to hall
   │  └─ Saves evidence image
   ├─ FRAME BROADCAST:
   │  ├─ Pushes frame to frame_broadcaster buffer
   │  └─ Accessible via GET /stream/{hall_id}
   ├─ PERIODIC ATTENDANCE CHECK:
   │  ├─ Every 30 minutes: marks absent students
   │  └─ Records in attendance table
   └─ WHISPER DETECTION (if enabled):
      ├─ Captures audio (16kHz)
      ├─ VAD analysis for speech
      ├─ If speech > 2 seconds:
      │  ├─ Creates violation
      │  └─ Sends to backend
      └─ Alert cooldown prevents spam

5. BACKEND RECEIVES AI EVENTS
   ├─ POST /api/ai-alert (from Python)
   │  ├─ Validates with Zod schema
   │  ├─ Inserts into ai_alerts table
   │  └─ Broadcasts Socket.IO "ai-alert" to hall:${hallId}
   ├─ POST /api/attendance (from Python)
   │  ├─ Only fires Socket.IO event (Python already wrote DB)
   │  └─ Frontend updates student list live
   └─ Socket.IO connects to hall room:
      └─ io.to(`hall:${hallId}`).emit("ai-alert", {...})

6. FRONTEND REAL-TIME UPDATES
   ├─ Invigilator connected to Socket.IO
   ├─ Receives "ai-alert" event:
   │  ├─ Shows notification/toast
   │  ├─ Updates alerts panel in real-time
   │  └─ Audio/visual alert (optional)
   ├─ Invigilator clicks "Confirm Violation":
   │  ├─ PATCH /api/ai-alerts/:id/status → "confirmed"
   │  ├─ Backend creates violation via violationEngine
   │  └─ Updates DB + broadcasts update
   └─ Invigilator clicks "Dismiss":
      └─ PATCH /api/ai-alerts/:id/status → "dismissed"

7. END OF EXAM
   ├─ Scheduler detects exam end time reached
   ├─ Calls stop_exam_worker(exam_id, hall_id)
   │  ├─ Sets exam_running[(exam_id, hall_id)] = False
   │  └─ Worker loop exits, releases camera
   ├─ Updates exam status → "completed"
   └─ Evidence (images) stored in evidence/ folder
```

### **Face Recognition Data Flow**

```
PRE-EXAM SETUP (Run once):
1. Admin uploads student photos to photos/ folder
2. Create embeddings script runs:
   ├─ For each photo:
   │  ├─ Extract filename → registration number
   │  ├─ cv2.imread(photo)
   │  ├─ InsightFace face detection
   │  ├─ Extract face embedding (512-dim vector)
   │  └─ INSERT INTO student_embeddings (student_id, embedding)
   └─ Embeddings now stored in DB

DURING EXAM:
1. load_embeddings.py runs at startup:
   ├─ SELECT all embeddings from student_embeddings
   ├─ Load into memory (NumPy arrays)
   ├─ Returns: (student_ids[], student_names[], embeddings[])
   └─ Kept in memory for fast comparison

2. On each frame in mark_attendance():
   ├─ Extract faces using InsightFace:
   │  ├─ face_detect = app.get(frame)
   │  └─ Returns: faces[].embedding (512-dim vector)
   ├─ Compare against loaded embeddings:
   │  ├─ Calculate L2 distance (Euclidean)
   │  ├─ Find closest match
   │  └─ If distance < threshold (likely ~0.4):
   │     └─ Identified as that student
   ├─ Record attendance:
   │  ├─ INSERT INTO attendance (student_id, exam_id, timestamp, status='present')
   │  └─ Notify backend POST /api/attendance
   └─ Save evidence: snapshot of detected face

3. Unknown faces:
   ├─ If no match found:
   │  ├─ Save unknown_face.jpg
   │  └─ Flag for manual review
   └─ Attendance record NOT created
```

### **Device Mapping Data Flow**

```
SETUP:
1. Admin configures devices in hardware pages:
   ├─ Cameras:
   │  ├─ Assigns position: "front" | "back" | "side"
   │  └─ Examples: "front"→attendance, "back"→cheating
   ├─ Microphones:
   │  ├─ Sets sensitivity: "high" | "low"
   │  └─ Sets row_number: 1, 2, 3... (front rows = speech detection)
   └─ Speakers:
      ├─ Sets volume_level: 50-100
      └─ High volume = alert speaker, low = instruction speaker

2. Stored in database tables:
   ├─ cameras(position, is_active, ...)
   ├─ microphones(sensitivity, row_number, ...)
   └─ speakers(volume_level, ...)

RUNTIME:
1. Python calls GET /api/hall-device-map?hall_id=1:
   ├─ Backend queries database
   ├─ Applies role logic:
   │  ├─ Camera: position="front" → "attendance_camera"
   │  ├─ Microphone: sensitivity="high" → "speech_detection_mic"
   │  └─ Speaker: volume_level>70 → "alert_speaker"
   └─ Returns JSON with organized devices by role

2. Python uses device map to:
   ├─ Select which camera for attendance (uses "attendance_camera")
   ├─ Select which microphone for speech (uses "speech_detection_mic")
   └─ Select which speaker for alerts (uses "alert_speaker")
```

---

## 6. Real-time / API Communication Flow

### **REST API Endpoints (Backend)**

**Authentication:**
- `POST /api/auth/login` - No auth required
  - Input: {email, password}
  - Output: {token, user: {id, name, email, role, hallIds}}

**Students:**
- `GET /api/students` - JWT required (hall-scoped for invigilators)
- `POST /api/students/upload/csv` - JWT + Admin required

**Exams:**
- `GET /api/exams` - JWT required (hall-scoped)
- `GET /api/exams/:id` - JWT required
- `POST /api/exams` - JWT + Admin required
- `PUT /api/exams/:id` - JWT + Admin required
- `DELETE /api/exams/:id` - JWT + Admin required
- `GET /api/exams/status/update` - Auto-updates exam statuses
- `POST /api/exams/upload/csv` - JWT + Admin required

**Exam Halls:**
- `GET /api/examhalls` - JWT required
- `GET /api/examhalls/:id` - JWT required
- `POST /api/examhalls` - JWT + Admin required
- `PATCH /api/examhalls/:id/status` - JWT + Admin required
- `DELETE /api/examhalls/:id` - JWT + Admin required
- `POST /api/examhalls/upload/csv` - JWT + Admin required

**Violations:**
- `GET /api/violations` - JWT required (hall-scoped)
- `GET /api/violations/:id` - JWT required (hall-scoped)
- `POST /api/violations` - JWT required
- `PATCH /api/violations/:id/status` - JWT required
  - Body: {status: "pending|confirmed|dismissed"}
- `DELETE /api/violations/:id` - JWT + Admin required

**AI Alerts:**
- `GET /api/ai-alerts` - JWT required (hall-scoped)
- `GET /api/ai-alerts/:id` - JWT required
- `POST /api/ai-alerts` - JWT + Admin required
- `PATCH /api/ai-alerts/:id/status` - JWT required
  - Body: {status: "pending|confirmed|dismissed"}
  - Action: If confirmed → creates violation via violationEngine
- `DELETE /api/ai-alerts/:id` - JWT + Admin required

**AI Ingestion Endpoints:**
- `POST /api/ai-alert` - JWT OR x-ai-key header required
  - Body: {event_id, type, confidence, timestamp, hall_id, student_id, exam_id}
  - Action: Inserts into ai_alerts, broadcasts Socket.IO
- `POST /api/attendance` - JWT OR x-ai-key header required
  - Body: {event_id, type, confidence, timestamp, hall_id, student_id, exam_id}
  - Action: Only broadcasts Socket.IO (Python already wrote DB)
- `POST /api/student-embeddings` - JWT OR x-ai-key header required
  - Body: {event_id, student_id, embedding: [float array]}

**Devices:**
- `GET /api/cameras` - JWT required
- `GET /api/microphones` - JWT required
- `GET /api/speakers` - JWT required
- `POST /api/cameras` - JWT + Admin required
- `PUT /api/cameras/:id` - JWT + Admin required
- `PATCH /api/cameras/:id/status` - JWT + Admin required
- `DELETE /api/cameras/:id` - JWT + Admin required
- Similar endpoints for microphones, speakers

**Device Mapping:**
- `GET /api/hall-device-map?hall_id=1` - JWT required
  - Output: Devices organized by functional role

**Seating:**
- `POST /api/seating` - JWT + Admin required
  - Body: Seating allocation data

**Reports:**
- `GET /api/reports` - JWT required
- `GET /api/reports/:id` - JWT required
- `POST /api/reports` - JWT + Admin required

**Video Streaming (Python):**
- `GET /stream/{hall_id}` - No auth required
  - Output: MJPEG stream (multipart/x-mixed-replace)

---

### **WebSocket Events (Socket.IO)**

**Connection:**
- Client connects to `http://backend:5000`
- Joins room: `hall:${hallId}` (e.g., `hall:1`)

**Events from Backend → Frontend:**
- `ai-alert` - AI detection
  ```javascript
  {
    event_id: "uuid",
    type: "cheating|impersonation|wrong_seat",
    confidence: 0.95,
    timestamp: "2024-01-15T10:30:00Z",
    hall_id: 1,
    student_id: "STU001",
    exam_id: 101,
    status: "pending"
  }
  ```

- `attendance` - Student marked present
  ```javascript
  {
    student_id: "STU001",
    exam_id: 101,
    hall_id: 1,
    confidence: 0.98,
    status: "present"
  }
  ```

- `violation-confirmed` - Alert confirmed as violation
- `violation-dismissed` - Alert dismissed

**Events from Frontend → Backend:**
- (Handled via REST API PATCH, not direct Socket.IO)

---

### **Python to Backend Communication**

**Authentication:**
- Header: `x-ai-key: eyeson-ai-key-2024`
- OR JWT token (with decoded payload)

**Events Sent by Python:**
1. `POST /api/ai-alert` - On cheating/seating/whisper detection
2. `POST /api/attendance` - On student recognized
3. `POST /api/student-embeddings` - On face embedding update

**Events Received by Python:**
- `GET /api/hall-device-map?hall_id=1` - To get device roles
- Exam start/stop via scheduler or manual endpoints:
  - `GET /exam/start/{exam_id}/{hall_id}`
  - `GET /exam/stop/{exam_id}/{hall_id}`

---

## 7. Non-Technical Explanation

### **What is EYESON?**

Imagine you're administering an exam with 100+ students sitting in a large hall. You need to catch cheating, verify everyone is present, ensure they sit in assigned seats, and detect if they're whispering to neighbors. You can't have one supervisor watch the entire room at once.

**EYESON is like hiring an AI supervisor** that watches the room 24/7 via:
- **Cameras** pointing at students
- **Microphones** listening for unauthorized talking
- **Speakers** to announce violations to the human supervisor

### **How Does It Work?**

1. **Before the Exam:**
   - Admin takes photos of all students and uploads them
   - AI learns each student's face (creates a "face ID")
   - Admin assigns seats to each student

2. **When Exam Starts:**
   - AI watches the camera feed
   - Recognizes each student's face and marks them "present"
   - Records their position in the room
   - Checks: "Is this student sitting in their assigned seat?"

3. **During the Exam:**
   - **Head Detection**: AI watches if student's head turns away from desk
     - Looking straight down = OK
     - Looking to side/back for >3 seconds = ALERT 🚨
   - **Seating**: If student moves to wrong seat = ALERT 🚨
   - **Speech**: If microphone detects unauthorized talking for >2 seconds = ALERT 🚨

4. **When Alert Triggered:**
   - AI takes a photo of the violation (evidence)
   - Sends alert to backend server
   - Backend notifies the invigilator (exam supervisor) immediately
   - Shows on supervisor's dashboard with:
     - Photo of violation
     - Which student
     - What rule was broken
     - Confidence score (how sure AI is)

5. **Invigilator Response:**
   - Supervisor sees alert on tablet/screen
   - Can confirm it's a real violation → recorded in system
   - Or dismiss it as false alarm
   - Walks over to address the student

6. **End of Exam:**
   - AI stops monitoring
   - Report generated showing:
     - Who attended
     - All violations detected
     - Evidence for each violation

### **Key Components in Simple Terms**

| Component | What It Does | Analogy |
|-----------|-------------|----------|
| **Cameras** | Records video of students | Security cameras |
| **Microphones** | Listens for talking | Listening device |
| **Speakers** | Announces alerts | Loudspeaker |
| **Face AI** | Recognizes student faces | Remembers faces like teacher does |
| **Head Pose AI** | Analyzes where student is looking | Watching if eyes are on desk |
| **Speech Detection** | Detects voices in audio | Hearing someone talk |
| **Frontend (Dashboard)** | Supervisor's control panel | Exam control room screen |
| **Backend Server** | Coordinates everything | Central command center |
| **Database** | Stores all data | Filing cabinet |

### **Real-World Scenario**

**Time: 10:00 AM - English Exam in Hall 1**

1. 9:55 AM: AI system initializes
   - Cameras turn on
   - Loads all student faces from database
   - Waits for exam to start

2. 10:00 AM: Exam begins
   - AI scans room, recognizes students: "Fatima, Ahmed, Zainab, Sami..." ✓
   - Records them as "present"
   - Checks: "Is Fatima in seat A1?" → Yes ✓

3. 10:15 AM: Suspicious activity
   - Ahmed's head turns left (looking at neighbor's paper)
   - Head stays turned for 4 seconds
   - 🚨 **ALERT: Potential cheating detected**
   - Photo taken showing Ahmed looking left
   - Dashboard shows: "Student Ahmed - Head turned 25°, Type: Gaze direction, Confidence: 92%"

4. 10:16 AM: Supervisor's response
   - Supervisor (Ms. Khan) sees alert on tablet
   - Walks to Ahmed's desk
   - Sees him quickly turning back to his own paper
   - Marks violation as "Confirmed" in system
   - Or clicks "Dismiss" if it was accidental

5. 10:45 AM: Another incident
   - Microphone detects: "What's the answer to question 5?"
   - 🚨 **ALERT: Unauthorized speech detected**
   - "Type: Whispering detected, Duration: 3 seconds"
   - Supervisor confirms and marks in system

6. 11:30 AM: Exam ends
   - Report generated automatically:
     - Attendance: 47/48 present (1 absent)
     - Violations: 2 confirmed
     - Evidence: 2 photos + audio log
   - Can be used for academic integrity review

---

## 8. Security & Architecture Notes

### **Authentication & Authorization**

- **JWT Tokens**: Issued on login, expire after 1 hour
- **Role-Based Access**:
  - **Admin**: Full access to all data
  - **Invigilator**: Can only see their assigned hall's data (hall-scoped)
- **Database as Source of Truth**: User roles verified against DB on each request
- **AI Authentication**: 
  - Python uses `x-ai-key` header OR JWT token
  - Allows Python to post events without web login

### **Hall Scope Filtering**

- **Concept**: Invigilators can only access data for halls they're assigned to
- **Implementation**:
  - On login: fetch `invigilator_halls` table to get assigned hall IDs
  - On each request: filter results to include only those hall IDs
  - **Example**: Invigilator assigned to Hall 1 cannot see violations from Hall 2

### **Data Flow Security**

- AI events validated with Zod schema before insertion
- Database transactions (implicit with PostgreSQL)
- No sensitive data in logs or URL parameters

### **Known Security Issues**

1. **Hardcoded JWT Secret**: "your_jwt_secret" should be in `.env`
2. **Hardcoded AI Key**: "eyeson-ai-key-2024" should be in `.env`
3. **Password Hashing**: Fallback to plaintext if bcrypt fails (legacy support)
4. **Database Credentials**: In `.env` file (good practice, but file must be secured)

---

## 9. Deployment Architecture

### **Three Separate Services**

```
┌──────────────────┐
│   PostgreSQL     │
│   Database       │
│   (Port 5432)    │
└────────┬─────────┘
         │ (TCP connection)
         │
    ┌────┴─────────────────────────────────────┐
    │                                           │
┌───v──────────────┐                   ┌─────v────────────┐
│  Express Server  │                   │  Python AI Server│
│  (Port 5000)     │                   │  (Port 8000)     │
│                  │◄──────Socket.IO───►                  │
│  Node.js         │ (WebSocket)        │  FastAPI + uvicorn
│  Express.js      │                    │                  │
│  Socket.IO       │                    │  - Face AI       │
│  PostgreSQL pg   │                    │  - Cheating Det  │
│  JWT/Bcrypt      │                    │  - Speech Det    │
│  Validation      │                    │  - Attendance    │
│  Device Mapping  │                    │  - Seating       │
└────┬─────────────┘                    └────┬─────────────┘
     │                                        │
     │ HTTP REST                              │ MJPEG Streaming
     │ WebSocket                              │ HTTP POST
     │                                        │
     │                                        │ Hardware:
     │                                        │ - Cameras
     └────────────┬─────────────────────────┬┘  - Microphones
                  │                         │   - Speakers
            ┌─────v─────────────────────────v──┐
            │     Browser Frontend (React)       │
            │     - Invigilator Dashboard        │
            │     - Admin Management Panels      │
            │     - Real-time Alerts             │
            └────────────────────────────────────┘
```

### **Network Ports**

- **Backend API**: http://localhost:5000 (Express)
- **Python AI**: http://localhost:8000 (FastAPI)
- **Database**: localhost:5432 (PostgreSQL)
- **Frontend**: http://localhost:5173 (Vite dev server)

### **Environment Configuration (.env files)**

**Backend** (`Backend/backend/.env`):
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ems_fyp
DB_USER=postgres
DB_PASSWORD=jannat420
PORT=5000
```

**AI** (`ai/.env`):
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ems_fyp
DB_USER=postgres
DB_PASSWORD=jannat420
```

---

## 10. Complete File Summary Table

| File | Type | Purpose | Key Functions |
|------|------|---------|---------------|
| **main.py** | Python | Exam worker loop | run_exam_worker() |
| **api_server.py** | Python | FastAPI + streaming | /stream/{hall_id}, /exam/start, etc |
| **orchestrator.py** | Python | Scheduler | scheduler_loop(), start/stop_scheduler() |
| **attendance.py** | Python | Face recognition | mark_attendance(), save_unknown_snapshot() |
| **seating.py** | Python | Seating verification | verify_seating(), save_seating_evidence() |
| **cheating.py** | Python | Head pose analysis | detect_cheating(), save_cheating_snapshot() |
| **whisper_detector.py** | Python | Speech detection | detect_whisper(), create_whisper_alert() |
| **recognition.py** | Python | Face model loader | FaceAnalysis init |
| **load_embeddings.py** | Python | Load embeddings | load_students() |
| **create_embeddings.py** | Python | Generate embeddings | Processes photos, creates embeddings |
| **camera_loader.py** | Python | Camera source | get_camera_source() |
| **microphone_loader.py** | Python | Mic source | get_microphone_device() |
| **frame_broadcaster.py** | Python | Frame buffer | push_frame(), get_frame() |
| **speaker_alert.py** | Python | Audio alerts | trigger_alert(), speak() |
| **exam_controller.py** | Python | Thread management | start/stop_exam_worker() |
| **db.py** | Python | DB connection | DB.get_connection() |
| **config.py** | Python | Config loader | Loads .env, DB_CONFIG |
| **server.js** | Node.js | Express app | Initializes app, routes, Socket.IO |
| **db.js** | Node.js | PostgreSQL pool | Pool config |
| **authController.js** | Node.js | Login | login() function |
| **studentController.js** | Node.js | Students | CRUD operations |
| **examController.js** | Node.js | Exams | CRUD, status updates |
| **violationController.js** | Node.js | Violations | CRUD violations |
| **alertController.js** | Node.js | AI alerts | CRUD alerts, create violations |
| **aiController.js** | Node.js | AI endpoints | ingestAiAlert(), ingestAttendance() |
| **violationEngine.js** | Node.js | Violation creator | createViolationAndAlertFromAiEvent() |
| **deviceMapService.js** | Node.js | Device roles | getDeviceMapForHall() |
| **authMiddleware.js** | Node.js | JWT verify | authenticate() |
| **roleMiddleware.js** | Node.js | Admin check | isAdmin() |
| **App.jsx** | React | Routes | Route definitions |
| **pages/Login.jsx** | React | Login UI | Email/password input |
| **pages/admin/** | React | Admin pages | Dashboard, exams, hardware, etc |
| **pages/invigilator/** | React | Supervisor pages | Dashboard, alerts, violations |
| **components/LiveCamera.jsx** | React | Video viewer | MJPEG stream display |
| **components/RealTimeAlertsPanel.jsx** | React | Alert panel | Socket.IO listener |

---

## 11. Final Summary

**EYESON** is a comprehensive AI-powered exam monitoring system with three main tiers:

1. **Python AI Engine**: Performs real-time computer vision and audio analysis
2. **Node.js/Express Backend**: Manages data, authentication, and real-time event distribution
3. **React Frontend**: Provides dashboards for admins and invigilators

The system automatically:
- ✅ Recognizes student faces and marks attendance
- ✅ Verifies students are sitting in assigned seats
- ✅ Detects cheating via head pose analysis (looking away)
- ✅ Detects unauthorized speech via microphone
- ✅ Takes evidence photos/audio for violations
- ✅ Notifies supervisors in real-time
- ✅ Maintains audit trail of all violations
- ✅ Generates reports for academic review

**Technology Stack**:
- **Frontend**: React, TypeScript, Tailwind CSS, React Query
- **Backend**: Node.js/Express, PostgreSQL, JWT, Socket.IO
- **AI**: Python, FastAPI, InsightFace, MediaPipe, Silero VAD

**Key Data Flows**:
- Exam scheduling → auto worker start → real-time monitoring → violation detection → supervisor notification → report generation
- Face recognition → embedding comparison → attendance marking → notification → dashboard update
- AI events → REST API → database → Socket.IO broadcast → frontend alert

---

## Additional Resources

- **Database**: PostgreSQL with 13+ tables for comprehensive data storage
- **Authentication**: JWT-based with role-based access control (Admin vs Invigilator)
- **Real-time**: Socket.IO for instant notifications and live updates
- **Video Streaming**: MJPEG format for live camera feeds
- **Evidence Storage**: Images and audio saved in evidence/ folder for compliance

**This system enables educational institutions to maintain exam integrity at scale while providing detailed audit trails for academic accountability.**

