const examHallService = require("../services/examHallService");

async function getAllExamHalls(req, res, next) {
  try {
    const exam_halls = await examHallService.getAllExamHalls(req.user);
    res.json({ exam_halls });
  } catch (err) { next(err); }
}

async function getExamHallById(req, res, next) {
  try {
    const exam_hall = await examHallService.getExamHallById(req.params.id, req.user);
    res.json({ exam_hall });
  } catch (err) { next(err); }
}

async function createExamHall(req, res, next) {
  try {
    const exam_hall = await examHallService.createExamHall(req.body);
    res.status(201).json({ message: "Exam hall created", exam_hall });
  } catch (err) { next(err); }
}

async function updateExamHallStatus(req, res, next) {
  try {
    const exam_hall = await examHallService.updateExamHallStatus(req.params.id, req.body.status);
    res.json({ message: `Hall status updated to '${req.body.status}'`, exam_hall });
  } catch (err) { next(err); }
}

async function deleteExamHall(req, res, next) {
  try {
    const deleted = await examHallService.deleteExamHall(req.params.id);
    res.json({ message: `Exam hall '${deleted.hall_number}' deleted successfully` });
  } catch (err) { next(err); }
}

async function uploadExamHallCSV(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });
    const { created, errors } = await examHallService.uploadExamHallCSV(req.file.buffer);
    res.status(201).json({
      message: `${created.length} hall(s) created, ${errors.length} skipped`,
      created,
      errors,
    });
  } catch (err) { next(err); }
}

module.exports = {
  getAllExamHalls,
  getExamHallById,
  createExamHall,
  updateExamHallStatus,
  deleteExamHall,
  uploadExamHallCSV,
};