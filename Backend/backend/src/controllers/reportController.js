const reportService = require("../services/reportService");

async function getReports(req, res, next) {
  try {
    const reports = await reportService.getAllReports(req.user);
    res.json(reports);
  } catch (err) { next(err); }
}

async function getReportById(req, res, next) {
  try {
    const report = await reportService.getReportById(req.params.id, req.user);
    res.json(report);
  } catch (err) { next(err); }
}

async function createReport(req, res) {
  res.status(405).json({ error: "Reports are generated dynamically and cannot be created manually" });
}

module.exports = { getReports, getReportById, createReport };