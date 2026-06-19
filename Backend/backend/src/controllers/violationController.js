const violationService = require("../services/violationService");

const getAllViolations = async (req, res, next) => {
  try {
    res.json(await violationService.getAllViolations(req.user));
  } catch (err) { next(err); }
};

const getViolationById = async (req, res, next) => {
  try {
    res.json(await violationService.getViolationById(req.params.id, req.user));
  } catch (err) { next(err); }
};

const createViolation = async (req, res, next) => {
  try {
    res.status(201).json(await violationService.createViolation(req.body));
  } catch (err) { next(err); }
};

const updateViolationStatus = async (req, res, next) => {
  try {
    res.json(await violationService.updateViolationStatus(req.params.id, req.body.status));
  } catch (err) { next(err); }
};

const deleteViolation = async (req, res, next) => {
  try {
    await violationService.deleteViolation(req.params.id);
    res.json({ message: "Violation deleted successfully" });
  } catch (err) { next(err); }
};

module.exports = {
  getAllViolations,
  getViolationById,
  createViolation,
  updateViolationStatus,
  deleteViolation,
};