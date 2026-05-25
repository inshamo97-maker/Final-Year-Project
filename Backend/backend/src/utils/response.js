function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function fail(res, error, status = 400) {
  const message =
    typeof error === "string"
      ? error
      : error?.message
        ? String(error.message)
        : "Unknown error";
  return res.status(status).json({ success: false, error: message });
}

module.exports = { ok, fail };

