const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const pool = require("./db");
const errorMiddleware = require("./utils/errorMiddleware");
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exitCode = 1;
});

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

async function ensureAiTables() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_alerts (
      id SERIAL PRIMARY KEY,
      event_id UUID UNIQUE NOT NULL,
      type TEXT NOT NULL,
      confidence DOUBLE PRECISION DEFAULT 0,
      "timestamp" TIMESTAMPTZ NOT NULL,
      hall_id INTEGER NOT NULL,
      exam_id TEXT NULL,
      student_id TEXT NULL,
      violation_id INTEGER NULL,
      alert_id INTEGER NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    `);
    // If the table pre-existed, it may be missing newer columns.
    await pool.query(`ALTER TABLE ai_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
    await pool.query(`ALTER TABLE ai_alerts ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION DEFAULT 0`);
  await pool.query(`ALTER TABLE ai_alerts ADD COLUMN IF NOT EXISTS hall_id INTEGER`);
  await pool.query(`ALTER TABLE ai_alerts ADD COLUMN IF NOT EXISTS exam_id TEXT NULL`);
  await pool.query(`ALTER TABLE ai_alerts ADD COLUMN IF NOT EXISTS student_id TEXT NULL`);
  await pool.query(`ALTER TABLE ai_alerts ADD COLUMN IF NOT EXISTS violation_id INTEGER NULL`);
  await pool.query(`ALTER TABLE ai_alerts ADD COLUMN IF NOT EXISTS alert_id INTEGER NULL`);
  await pool.query(`ALTER TABLE ai_alerts ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'`);
  await pool.query(`UPDATE ai_alerts SET status = 'pending' WHERE status IS NULL`);
  await pool.query(`ALTER TABLE ai_alerts ALTER COLUMN status SET DEFAULT 'pending'`);
  await pool.query(`ALTER TABLE ai_alerts ALTER COLUMN status SET NOT NULL`);
  
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ai_alerts_created_at ON ai_alerts (created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ai_alerts_hall_id_created_at ON ai_alerts (hall_id, created_at DESC)`);
  
  await pool.query(`
    ALTER TABLE ai_alerts
    ALTER COLUMN confidence SET DEFAULT 0
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        event_id UUID UNIQUE NOT NULL,
  type TEXT NOT NULL,
  confidence DOUBLE PRECISION DEFAULT 0,
  "timestamp" TIMESTAMPTZ NOT NULL,
  hall_id INTEGER,
  exam_id TEXT,
  student_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `);
  await pool.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
  await pool.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION DEFAULT 0`);
  await pool.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS hall_id INTEGER`);
  await pool.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS exam_id TEXT NULL`);
  await pool.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS student_id TEXT NULL`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance (created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendance_hall_id_created_at ON attendance (hall_id, created_at DESC)`);
  
  await pool.query(`
   CREATE TABLE IF NOT EXISTS student_embeddings (
  id SERIAL PRIMARY KEY,
  event_id UUID UNIQUE NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  embedding JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `);
  await pool.query(`ALTER TABLE student_embeddings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
  await pool.query(`ALTER TABLE student_embeddings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_student_embeddings_updated_at ON student_embeddings (updated_at DESC)`);
}

async function ensureStudentTableCompatibility() {
  const result = await pool.query(`SELECT to_regclass('public.students') AS table_name`);
  if (!result.rows[0]?.table_name) return;

  await pool.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number TEXT`);
  await pool.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT`);
}

// Routes
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const examHallRoutes = require("./routes/examHallRoutes");
const reportRoutes = require("./routes/reportRoutes");
const invigilatorRoutes = require("./routes/invigilatorRoutes");
const examRoutes = require("./routes/examRoutes");
const speakerRoutes = require("./routes/speakerRoutes");
const cameraRoutes = require("./routes/cameraRoutes");
const microphoneRoutes = require("./routes/microphonesRoutes");
const violationRoutes = require("./routes/violationRoutes");
const alertRoutes = require("./routes/alertRoutes");
const aiRoutes = require("./routes/aiRoutes");
const seatingRoutes = require("./routes/seatingRoutes");
const deviceMapRoutes = require("./routes/deviceMapRoutes");
const seatAllocationRoutes = require("./routes/seatAllocationRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Make Socket.IO available to controllers/services
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join-hall", (hallId) => {
    if (hallId == null) return;
    socket.join(`hall:${hallId}`);
  });
  socket.on("leave-hall", (hallId) => {
    if (hallId == null) return;
    socket.leave(`hall:${hallId}`);
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/examhalls", examHallRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/invigilators", invigilatorRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/speakers", speakerRoutes);
app.use("/api/microphones", microphoneRoutes);
app.use("/api/cameras", cameraRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/ai-alerts", alertRoutes);
app.use("/api/seating", seatingRoutes);
app.use("/api/hall-device-map", deviceMapRoutes);
app.use("/api", aiRoutes);
app.use("/api", require("./routes/seatingReadRoutes"));
app.use("/api/seat-allocation", seatAllocationRoutes);
app.use(errorMiddleware);
ensureAiTables()
  .then(ensureStudentTableCompatibility)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize AI tables:", err);
    process.exitCode = 1;
  });
