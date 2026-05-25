const { fail } = require("../utils/response");

function aiAuth(req, res, next) {
  const expected = process.env.AI_API_KEY;
  if (!expected) {
    return fail(res, "AI_API_KEY is not configured", 500);
  }

  const provided = req.header("x-ai-key");
  if (!provided || provided !== expected) {
    return fail(res, "Unauthorized", 401);
  }

  return next();
}

module.exports = { aiAuth };

