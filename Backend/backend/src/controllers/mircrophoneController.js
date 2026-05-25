const pool = require('../db');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { filterByHallScope, canAccessHall } = require('../utils/hallScope');

const getAllMicrophones = async (req, res) => {
  try {
    console.log("[scope] microphones", { role: req.user?.role, hallIds: req.user?.hallIds || [] });
    const result = await pool.query('SELECT * FROM microphones ORDER BY id ASC');
    const filtered = filterByHallScope(result.rows, req.user);
    console.log("[scope] microphones results", { before: result.rows.length, after: filtered.length });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMicrophoneById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM microphones WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Microphone not found' });
    if (!canAccessHall(req.user, result.rows[0].hall_id)) return res.status(404).json({ error: 'Microphone not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createMicrophone = async (req, res) => {
  try {
    const { is_active, range, sensitivity, hall_id, row_number, column_number } = req.body;
    if (!hall_id || !row_number || !column_number) {
      return res.status(400).json({ error: 'hall_id, row_number, and column_number are required' });
    }
    const result = await pool.query(
      `INSERT INTO microphones (is_active, range, sensitivity, hall_id, row_number, column_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [is_active ?? true, range ?? null, sensitivity ?? null, hall_id, row_number, column_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateMicrophone = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, range, sensitivity, hall_id, row_number, column_number } = req.body;

    const existing = await pool.query('SELECT * FROM microphones WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Microphone not found' });

    const m = existing.rows[0];
    const result = await pool.query(
      `UPDATE microphones SET
        is_active     = $1,
        range         = $2,
        sensitivity   = $3,
        hall_id       = $4,
        row_number    = $5,
        column_number = $6
       WHERE id = $7 RETURNING *`,
      [
        is_active     ?? m.is_active,
        range         ?? m.range,
        sensitivity   ?? m.sensitivity,
        hall_id       ?? m.hall_id,
        row_number    ?? m.row_number,
        column_number ?? m.column_number,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleMicrophoneStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM microphones WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Microphone not found' });

    const newStatus = !existing.rows[0].is_active;
    const result = await pool.query(
      'UPDATE microphones SET is_active = $1 WHERE id = $2 RETURNING *',
      [newStatus, id]
    );
    res.json({ message: `Microphone is now ${newStatus ? 'active' : 'inactive'}`, microphone: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteMicrophone = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM microphones WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Microphone not found' });

    await pool.query('DELETE FROM microphones WHERE id = $1', [id]);
    res.json({ message: 'Microphone deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadMicrophonesCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results = [];
  const errors = [];

  Readable.from(req.file.buffer.toString())
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      let inserted = 0;
      for (const row of results) {
        const { is_active, range, sensitivity, hall_id, row_number, column_number } = row;
        if (!hall_id || !row_number || !column_number) {
          errors.push({ row, reason: 'Missing required fields' });
          continue;
        }
        try {
          await pool.query(
            `INSERT INTO microphones (is_active, range, sensitivity, hall_id, row_number, column_number)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [is_active === 'true', range || null, sensitivity || null, parseInt(hall_id), parseInt(row_number), parseInt(column_number)]
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
  getAllMicrophones,
  getMicrophoneById,
  createMicrophone,
  updateMicrophone,
  toggleMicrophoneStatus,
  deleteMicrophone,
  uploadMicrophonesCSV
};
