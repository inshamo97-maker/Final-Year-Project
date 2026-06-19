const microphoneService = require("../services/microphoneService");

const getAllMicrophones = async (req, res, next) => {
  try {
    const microphones = await microphoneService.getAllMicrophones(req.user);
    res.json(microphones);
  } catch (err) { next(err); }
};

const getMicrophoneById = async (req, res, next) => {
  try {
    const microphone = await microphoneService.getMicrophoneById(req.params.id, req.user);
    res.json(microphone);
  } catch (err) { next(err); }
};

const createMicrophone = async (req, res, next) => {
  try {
    const microphone = await microphoneService.createMicrophone(req.body);
    res.status(201).json(microphone);
  } catch (err) { next(err); }
};

const updateMicrophone = async (req, res, next) => {
  try {
    const microphone = await microphoneService.updateMicrophone(req.params.id, req.body);
    res.json(microphone);
  } catch (err) { next(err); }
};

const toggleMicrophoneStatus = async (req, res, next) => {
  try {
    const result = await microphoneService.toggleMicrophoneStatus(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
};

const deleteMicrophone = async (req, res, next) => {
  try {
    await microphoneService.deleteMicrophone(req.params.id);
    res.json({ message: "Microphone deleted successfully" });
  } catch (err) { next(err); }
};

const uploadMicrophonesCSV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const result = await microphoneService.uploadMicrophonesCSV(req.file.buffer);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

module.exports = {
  getAllMicrophones,
  getMicrophoneById,
  createMicrophone,
  updateMicrophone,
  toggleMicrophoneStatus,
  deleteMicrophone,
  uploadMicrophonesCSV,
};