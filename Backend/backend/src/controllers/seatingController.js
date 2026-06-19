const seatingPlanService = require("../services/seatingService");

async function saveSeatingPlan(req, res, next) {
  try {
    const halls = Array.isArray(req.body?.halls) ? req.body.halls : [];
    await seatingPlanService.saveSeatingPlan(halls);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { saveSeatingPlan };