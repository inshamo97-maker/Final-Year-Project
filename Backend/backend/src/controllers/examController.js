const examService = require("../services/examService");

async function getAllExams(req, res, next) {
  try {
    const exams = await examService.getAllExams(req.user);
    res.json({ exams });
  } catch (err) { next(err); }
}

async function getExamById(req, res, next) {
  try {
    const exam = await examService.getExamById(req.params.id, req.user);
    res.json({ exam });
  } catch (err) { next(err); }
}

async function createExam(req, res, next) {
  try {
    const exam = await examService.createExam(req.body);
    res.status(201).json({ message: "Exam created", exam });
  } catch (err) { next(err); }
}

async function updateExam(req, res, next) {
  try {
    const exam = await examService.updateExam(req.params.id, req.body);
    res.json({ message: "Exam updated", exam });
  } catch (err) { next(err); }
}

async function deleteExam(req, res, next) {
  try {
    const deleted = await examService.deleteExam(req.params.id);
    res.json({ message: `Exam '${deleted.name}' deleted successfully` });
  } catch (err) { next(err); }
}


async function uploadExamCSV(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });
    const { created, errors } = await examService.uploadExamCSV(req.file.buffer);
    res.status(201).json({
      message: `${created.length} exam(s) created, ${errors.length} skipped`,
      created,
      errors,
    });
  } catch (err) { next(err); }
}

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,

  uploadExamCSV,
};