const { fail } = require("../utils/response");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = Number(err?.status || err?.statusCode || 500);
  const message = err?.message || "Internal server error";

  if (res.headersSent) return;
  fail(res, message, status);
}

module.exports = { errorHandler };

