const seatAllocationService = require("../services/seatAllocationService");

exports.getSeatAllocationsByExam = async (req, res, next) => {
  try {
    const rows = await seatAllocationService.getSeatAllocationsByExam(req.query.examId);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.uploadSeatAllocationsCSV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });
    const result = await seatAllocationService.uploadSeatAllocationsCSV(req.file.buffer);
    res.status(200).json(result);
  } catch (err) { next(err); }
};