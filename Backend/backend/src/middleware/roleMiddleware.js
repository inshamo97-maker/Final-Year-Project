// middleware/roleMiddleware.js

function isAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
}

module.exports = { isAdmin };