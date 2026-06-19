const studentService = require("../services/studentService");

async function getStudentsForInvigilator(req, res, next) {
  try {
    res.json(await studentService.getStudentsForInvigilator(req.user));
  } catch (err) { next(err); }
}

async function addStudent(req, res, next) {
  try {
    const student = await studentService.addStudent(req.body);
    res.status(201).json({ message: "Student added successfully", student });
  } catch (err) { next(err); }
}

async function deleteStudent(req, res, next) {
  try {
    const deleted = await studentService.deleteStudent(req.params.id);
    res.json({ message: "Student deleted successfully", deleted });
  } catch (err) { next(err); }
}

async function uploadStudentsCSV(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });
    const { created, errors } = await studentService.uploadStudentsCSV(req.file.buffer);
    res.status(created.length ? 201 : 400).json({
      message: `${created.length} student(s) created, ${errors.length} skipped`,
      created,
      errors,
    });
  } catch (err) { next(err); }
}

module.exports = {
  getStudentsForInvigilator,
  addStudent,
  deleteStudent,
  uploadStudentsCSV,
};