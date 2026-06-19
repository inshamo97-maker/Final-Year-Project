const AppError = require("./AppError");

// Registered last in app.js:  app.use(errorMiddleware)
function errorMiddleware(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.status ? err.message : "Server error";
  res.status(status).json({ error: message });
}

module.exports = errorMiddleware;
