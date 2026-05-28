const pool = require('../db');
const { randomUUID } = require('crypto');
const { filterByHallScope, canAccessHall } = require('../utils/hallScope');

const getAllAlerts = async (req, res) => {
  try {
    console.log("[scope] ai_alerts", { role: req.user?.role, hallIds: req.user?.hallIds || [] });
    const result = await pool.query(`
      SELECT
        a.*,
        COALESCE(v.type, a.type) AS violation_type,
        COALESCE(v.hall_id, a.hall_id) AS hall_id,
        COALESCE(v.student_id, a.student_id) AS student_id
      FROM ai_alerts a
      LEFT JOIN violations v ON a.violation_id = v.id
      ORDER BY a.timestamp DESC
    `);
    const filtered = filterByHallScope(result.rows, req.user);
    console.log("[scope] ai_alerts results", { before: result.rows.length, after: filtered.length });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        a.*,
        COALESCE(v.type, a.type) AS violation_type,
        COALESCE(v.hall_id, a.hall_id) AS hall_id,
        COALESCE(v.student_id, a.student_id) AS student_id
      FROM ai_alerts a
      LEFT JOIN violations v ON a.violation_id = v.id
      WHERE a.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
    if (!canAccessHall(req.user, result.rows[0].hall_id)) return res.status(404).json({ error: 'Alert not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAlert = async (req, res) => {
  try {
    const { event_id, type, confidence, timestamp, hall_id, exam_id, student_id, violation_id } = req.body;
    if (!type || !timestamp || !hall_id) {
      return res.status(400).json({ error: 'type, timestamp, and hall_id are required' });
    }

    if (violation_id) {
      const violation = await pool.query('SELECT * FROM violations WHERE id = $1', [violation_id]);
      if (violation.rows.length === 0) {
        return res.status(404).json({ error: 'Violation not found' });
      }
    }

    const result = await pool.query(
      `INSERT INTO ai_alerts (event_id, type, confidence, timestamp, hall_id, exam_id, student_id, violation_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
      [event_id || randomUUID(), type, confidence ?? 0, timestamp, hall_id, exam_id ?? null, student_id ?? null, violation_id ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'status is required' });
    if (!['pending', 'reviewed'].includes(status)) {
      return res.status(400).json({ error: 'status must be pending or reviewed' });
    }

    const existing = await pool.query('SELECT * FROM ai_alerts WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });

    const result = await pool.query(
      'UPDATE ai_alerts SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM ai_alerts WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });

    await pool.query('DELETE FROM ai_alerts WHERE id = $1', [id]);
    res.json({ message: 'Alert deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlertStatus,
  deleteAlert
};
