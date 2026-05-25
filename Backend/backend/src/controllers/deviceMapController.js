const { getDeviceMapForHall } = require("../services/deviceMapService");

async function getHallDeviceMap(req, res, next) {
  try {
    const hallId = req.query.hall_id;

    if (!hallId) {
      console.error("[deviceMapController] Missing hall_id");
      return res.status(400).json({ error: "hall_id query parameter required" });
    }

    console.log(`[deviceMapController] Request received for hall_id: ${hallId}`);

    const deviceMap = await getDeviceMapForHall(parseInt(hallId));

    // 🔴 IMPORTANT: log full backend output
    console.log("[deviceMapController] Device map response:");
    console.dir(deviceMap, { depth: null });

    // 🧠 extra safety check
    if (!deviceMap) {
      console.warn("[deviceMapController] deviceMap is null/undefined");
    }

    return res.status(200).json(deviceMap);

  } catch (err) {
    console.error("[deviceMapController] ERROR:", err);
    return res.status(500).json({
      error: "Failed to load device map",
      details: err.message
    });
  }
}

module.exports = { getHallDeviceMap };