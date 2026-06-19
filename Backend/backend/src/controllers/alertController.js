const alertService = require("../services/alertService");

const getAllAlerts = async (req, res, next) => {
  try {
    const alerts = await alertService.getAllAlerts(req.user);
    res.json(alerts);
  } catch (err) { next(err); }
};

const getAlertById = async (req, res, next) => {
  try {
    const alert = await alertService.getAlertById(req.params.id, req.user);
    res.json(alert);
  } catch (err) { next(err); }
};

const createAlert = async (req, res, next) => {
  try {
    const alert = await alertService.createAlert(req.body);
    res.status(201).json(alert);
  } catch (err) { next(err); }
};

const updateAlertStatus = async (req, res, next) => {
  try {
    const alert = await alertService.updateAlertStatus(req.params.id, req.body.status);
    res.json(alert);
  } catch (err) { next(err); }
};

const deleteAlert = async (req, res, next) => {
  try {
    await alertService.deleteAlert(req.params.id);
    res.json({ message: "Alert deleted successfully" });
  } catch (err) { next(err); }
};

module.exports = {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlertStatus,
  deleteAlert,
};
