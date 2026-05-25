const pool = require('../db');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { filterByHallScope, canAccessHall } = require('../utils/hallScope');

const VALID_STATUSES = ['active', 'inactive', 'offline'];

const getAllSpeakers = async (req, res) => {
  try {
    console.log("[scope] speakers", { role: req.user?.role, hallIds: req.user?.hallIds || [] });
    const result = await pool.query('SELECT * FROM speakers ORDER BY id ASC');
    const filtered = filterByHallScope(result.rows, req.user);
    console.log("[scope] speakers results", { before: result.rows.length, after: filtered.length });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSpeakerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM speakers WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Speaker not found' });
    if (!canAccessHall(req.user, result.rows[0].hall_id)) return res.status(404).json({ error: 'Speaker not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSpeaker = async (req, res) => {
  try {
    const { label, status, ip_address, volume_level, hall_id, last_active_timestamp } = req.body;
    if (!label || !ip_address || !hall_id) {
      return res.status(400).json({ error: 'label, ip_address, and hall_id are required' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const result = await pool.query(
      `INSERT INTO speakers (label, status, ip_address, volume_level, hall_id, last_active_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [label, status ?? 'inactive', ip_address, volume_level ?? 50, hall_id, last_active_timestamp ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSpeaker = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, status, ip_address, volume_level, hall_id, last_active_timestamp } = req.body;

    const existing = await pool.query('SELECT * FROM speakers WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Speaker not found' });

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const s = existing.rows[0];
    const result = await pool.query(
      `UPDATE speakers SET
        label                = $1,
        status               = $2,
        ip_address           = $3,
        volume_level         = $4,
        hall_id              = $5,
        last_active_timestamp = $6
       WHERE id = $7 RETURNING *`,
      [
        label                ?? s.label,
        status               ?? s.status,
        ip_address           ?? s.ip_address,
        volume_level         ?? s.volume_level,
        hall_id              ?? s.hall_id,
        last_active_timestamp ?? s.last_active_timestamp,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSpeakerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'status is required' });
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const existing = await pool.query('SELECT * FROM speakers WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Speaker not found' });

    const result = await pool.query(
      'UPDATE speakers SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json({ message: `Speaker status updated to ${status}`, speaker: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteSpeaker = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM speakers WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Speaker not found' });

    await pool.query('DELETE FROM speakers WHERE id = $1', [id]);
    res.json({ message: 'Speaker deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadSpeakersCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results = [];
  const errors = [];

  Readable.from(req.file.buffer.toString())
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      let inserted = 0;
      for (const row of results) {
        const { label, status, ip_address, volume_level, hall_id, last_active_timestamp } = row;
        if (!label || !ip_address || !hall_id) {
          errors.push({ row, reason: 'Missing required fields' });
          continue;
        }
        if (status && !VALID_STATUSES.includes(status)) {
          errors.push({ row, reason: `Invalid status: ${status}` });
          continue;
        }
        try {
          await pool.query(
            `INSERT INTO speakers (label, status, ip_address, volume_level, hall_id, last_active_timestamp)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [label, status || 'inactive', ip_address, parseInt(volume_level) || 50, parseInt(hall_id), last_active_timestamp || null]
          );
          inserted++;
        } catch (err) {
          errors.push({ row, reason: err.message });
        }
      }

      res.status(201).json({ inserted, failed: errors.length, errors });
    })
    .on('error', (err) => res.status(500).json({ error: err.message }));
};

module.exports = {
  getAllSpeakers,
  getSpeakerById,
  createSpeaker,
  updateSpeaker,
  updateSpeakerStatus,
  deleteSpeaker,
  uploadSpeakersCSV
};
