const authService = require("../services/authService");

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { login };