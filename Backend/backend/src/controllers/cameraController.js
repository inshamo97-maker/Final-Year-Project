const cameraService = require("../services/cameraService");

const getAllCameras = async (req, res, next) => {
  try {
    const cameras = await cameraService.getAllCameras(req.user);
    res.json(cameras);
  } catch (err) { next(err); }
};

const getCameraById = async (req, res, next) => {
  try {
    const camera = await cameraService.getCameraById(req.params.id, req.user);
    res.json(camera);
  } catch (err) { next(err); }
};

const createCamera = async (req, res, next) => {
  try {
    const camera = await cameraService.createCamera(req.body);
    res.status(201).json(camera);
  } catch (err) { next(err); }
};

const updateCamera = async (req, res, next) => {
  try {
    const camera = await cameraService.updateCamera(req.params.id, req.body);
    res.json(camera);
  } catch (err) { next(err); }
};

const toggleCameraStatus = async (req, res, next) => {
  try {
    const result = await cameraService.toggleCameraStatus(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
};

const deleteCamera = async (req, res, next) => {
  try {
    await cameraService.deleteCamera(req.params.id);
    res.json({ message: "Camera deleted successfully" });
  } catch (err) { next(err); }
};

const uploadCamerasCSV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const result = await cameraService.uploadCamerasCSV(req.file.buffer);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

module.exports = {
  getAllCameras,
  getCameraById,
  createCamera,
  updateCamera,
  toggleCameraStatus,
  deleteCamera,
  uploadCamerasCSV,
};
