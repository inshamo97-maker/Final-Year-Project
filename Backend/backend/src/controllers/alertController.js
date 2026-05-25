const pool = require('../db');
const { filterByHallScope, canAccessHall } = require('../utils/hallScope');

const getAllAlerts = async (req, res) => {
  try {
    console.log("[scope] alerts", { role: req.user?.role, hallIds: req.user?.hallIds || [] });
    const result = await pool.query(`
      SELECT a.*, v.type as violation_type, v.hall_id, v.student_id
      FROM alerts a
      LEFT JOIN violations v ON a.violation_id = v.id
      ORDER BY a.timestamp DESC
    `);
    const filtered = filterByHallScope(result.rows, req.user);
    console.log("[scope] alerts results", { before: result.rows.length, after: filtered.length });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT a.*, v.type as violation_type, v.hall_id, v.student_id
      FROM alerts a
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
    const { violation_id, sent_to } = req.body;
    if (!violation_id || !sent_to) {
      return res.status(400).json({ error: 'violation_id and sent_to are required' });
    }

    // check violation exists
    const violation = await pool.query('SELECT * FROM violations WHERE id = $1', [violation_id]);
    if (violation.rows.length === 0) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    const result = await pool.query(
      `INSERT INTO alerts (violation_id, sent_to, status, timestamp)
       VALUES ($1, $2, 'pending', NOW()) RETURNING *`,
      [violation_id, sent_to]
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

    const existing = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });

    const result = await pool.query(
      'UPDATE alerts SET status = $1 WHERE id = $2 RETURNING *',
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
    const existing = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });

    await pool.query('DELETE FROM alerts WHERE id = $1', [id]);
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