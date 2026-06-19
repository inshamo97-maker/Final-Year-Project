const { getDeviceMapForHall } = require("../services/deviceMapService");
const AppError = require("../utils/AppError");

async function getHallDeviceMap(req, res, next) {
  try {
    const hallId = req.query.hall_id;
    if (!hallId) throw new AppError("hall_id query parameter required", 400);

    const deviceMap = await getDeviceMapForHall(parseInt(hallId));
    res.status(200).json(deviceMap);
  } catch (err) { next(err); }
}

module.exports = { getHallDeviceMap };
