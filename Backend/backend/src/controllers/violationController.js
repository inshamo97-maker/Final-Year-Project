const pool = require('../db');
const { filterByHallScope, canAccessHall } = require('../utils/hallScope');

// Production statuses (aligned with Violation Engine):
// - pending: detected, awaiting human review
// - confirmed: verified by invigilator/admin
// - dismissed: false positive / ignored
const VALID_STATUSES = ['pending', 'confirmed', 'dismissed'];

const getAllViolations = async (req, res) => {
  try {
    console.log("[scope] violations", { role: req.user?.role, hallIds: req.user?.hallIds || [] });
    const result = await pool.query('SELECT * FROM violations ORDER BY timestamp DESC');
    const filtered = filterByHallScope(result.rows, req.user);
    console.log("[scope] violations results", { before: result.rows.length, after: filtered.length });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getViolationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Violation not found' });
    if (!canAccessHall(req.user, result.rows[0].hall_id)) return res.status(404).json({ error: 'Violation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createViolation = async (req, res) => {
  try {
    const { type, evidence_path, confidence, camera_id, hall_id, student_id, mic_id } = req.body;
    if (!type || !hall_id) {
      return res.status(400).json({ error: 'type and hall_id are required' });
    }
    const result = await pool.query(
      `INSERT INTO violations (type, evidence_path, confidence, camera_id, hall_id, student_id, mic_id, status, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW()) RETURNING *`,
      [type, evidence_path ?? null, confidence ?? null, camera_id ?? null, hall_id, student_id ?? null, mic_id ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateViolationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const existing = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Violation not found' });

    const result = await pool.query(
      'UPDATE violations SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteViolation = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM violations WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Violation not found' });

    await pool.query('DELETE FROM violations WHERE id = $1', [id]);
    res.json({ message: 'Violation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllViolations,
  getViolationById,
  createViolation,
  updateViolationStatus,
  deleteViolation
};