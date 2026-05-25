const pool = require('../db');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { filterByHallScope, canAccessHall } = require('../utils/hallScope');

// GET all cameras
const getAllCameras = async (req, res) => {
  try {
    console.log("[scope] cameras", { role: req.user?.role, hallIds: req.user?.hallIds || [] });
    const result = await pool.query('SELECT * FROM cameras ORDER BY id ASC');
    const filtered = filterByHallScope(result.rows, req.user);
    console.log("[scope] cameras results", { before: result.rows.length, after: filtered.length });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single camera
const getCameraById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM cameras WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Camera not found' });
    if (!canAccessHall(req.user, result.rows[0].hall_id)) return res.status(404).json({ error: 'Camera not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST create camera
const createCamera = async (req, res) => {
  try {
    const { position, ip_address, model, hall_id, is_active } = req.body;
    if (!position || !ip_address || !model || !hall_id) {
      return res.status(400).json({ error: 'position, ip_address, model, and hall_id are required' });
    }
    const result = await pool.query(
      'INSERT INTO cameras (position, ip_address, model, hall_id, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [position, ip_address, model, hall_id, is_active ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update camera
const updateCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, ip_address, model, hall_id, is_active } = req.body;

    const existing = await pool.query('SELECT * FROM cameras WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Camera not found' });

    const cam = existing.rows[0];
    const result = await pool.query(
      `UPDATE cameras SET
        position   = $1,
        ip_address = $2,
        model      = $3,
        hall_id    = $4,
        is_active  = $5
       WHERE id = $6 RETURNING *`,
      [
        position   ?? cam.position,
        ip_address ?? cam.ip_address,
        model      ?? cam.model,
        hall_id    ?? cam.hall_id,
        is_active  ?? cam.is_active,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH toggle is_active
const toggleCameraStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM cameras WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Camera not found' });

    const newStatus = !existing.rows[0].is_active;
    const result = await pool.query(
      'UPDATE cameras SET is_active = $1 WHERE id = $2 RETURNING *',
      [newStatus, id]
    );
    res.json({ message: `Camera is now ${newStatus ? 'active' : 'inactive'}`, camera: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE camera
const deleteCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM cameras WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Camera not found' });

    await pool.query('DELETE FROM cameras WHERE id = $1', [id]);
    res.json({ message: 'Camera deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST upload CSV
const uploadCamerasCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results = [];
  const errors = [];

  Readable.from(req.file.buffer.toString())
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      let inserted = 0;
      for (const row of results) {
        const { position, ip_address, model, hall_id, is_active } = row;
        if (!position || !ip_address || !model || !hall_id) {
          errors.push({ row, reason: 'Missing required fields' });
          continue;
        }
        try {
          await pool.query(
            'INSERT INTO cameras (position, ip_address, model, hall_id, is_active) VALUES ($1, $2, $3, $4, $5)',
            [position, ip_address, model, parseInt(hall_id), is_active === 'true']
          );
          inserted++;
        } catch (err) {
          errors.push({ row, reason: err.message });
        }
      }

      res.status(201).json({ inserted, failed: errors.length, errors });
    })
    .on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
};

module.exports = {
  getAllCameras,
  getCameraById,
  createCamera,
  updateCamera,
  toggleCameraStatus,
  deleteCamera,
  uploadCamerasCSV
};
