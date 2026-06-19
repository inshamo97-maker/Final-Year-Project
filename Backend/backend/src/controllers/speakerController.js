const speakerService = require("../services/speakerService");

const getAllSpeakers = async (req, res, next) => {
  try {
    res.json(await speakerService.getAllSpeakers(req.user));
  } catch (err) { next(err); }
};

const getSpeakerById = async (req, res, next) => {
  try {
    res.json(await speakerService.getSpeakerById(req.params.id, req.user));
  } catch (err) { next(err); }
};

const createSpeaker = async (req, res, next) => {
  try {
    res.status(201).json(await speakerService.createSpeaker(req.body));
  } catch (err) { next(err); }
};

const updateSpeaker = async (req, res, next) => {
  try {
    res.json(await speakerService.updateSpeaker(req.params.id, req.body));
  } catch (err) { next(err); }
};

const updateSpeakerStatus = async (req, res, next) => {
  try {
    const speaker = await speakerService.updateSpeakerStatus(req.params.id, req.body.status);
    res.json({ message: `Speaker status updated to ${req.body.status}`, speaker });
  } catch (err) { next(err); }
};

const deleteSpeaker = async (req, res, next) => {
  try {
    await speakerService.deleteSpeaker(req.params.id);
    res.json({ message: "Speaker deleted successfully" });
  } catch (err) { next(err); }
};

const uploadSpeakersCSV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.status(201).json(await speakerService.uploadSpeakersCSV(req.file.buffer));
  } catch (err) { next(err); }
};

module.exports = {
  getAllSpeakers,
  getSpeakerById,
  createSpeaker,
  updateSpeaker,
  updateSpeakerStatus,
  deleteSpeaker,
  uploadSpeakersCSV,
};