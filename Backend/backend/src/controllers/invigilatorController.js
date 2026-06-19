const invigilatorService = require("../services/invigilatorService");

async function getAllInvigilators(req, res, next) {
  try {
    const invigilators = await invigilatorService.getAllInvigilators();
    res.json({ invigilators });
  } catch (err) { next(err); }
}

async function getInvigilatorById(req, res, next) {
  try {
    const invigilator = await invigilatorService.getInvigilatorById(req.params.id);
    res.json({ invigilator });
  } catch (err) { next(err); }
}

async function createInvigilator(req, res, next) {
  try {
    const invigilator = await invigilatorService.createInvigilator(req.body);
    res.status(201).json({ message: "Invigilator created", invigilator });
  } catch (err) { next(err); }
}

async function updateInvigilator(req, res, next) {
  try {
    const invigilator = await invigilatorService.updateInvigilator(req.params.id, req.body);
    res.json({ message: "Invigilator updated", invigilator });
  } catch (err) { next(err); }
}

async function deleteInvigilator(req, res, next) {
  try {
    const deleted = await invigilatorService.deleteInvigilator(req.params.id);
    res.json({ message: `Invigilator '${deleted.name}' deleted successfully` });
  } catch (err) { next(err); }
}

async function uploadCSV(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });
    const { created, errors } = await invigilatorService.uploadCSV(req.file.buffer);
    res.status(201).json({
      message: `${created.length} invigilator(s) created, ${errors.length} skipped`,
      created,
      errors,
    });
  } catch (err) { next(err); }
}

module.exports = {
  getAllInvigilators,
  getInvigilatorById,
  createInvigilator,
  updateInvigilator,
  deleteInvigilator,
  uploadCSV,
};