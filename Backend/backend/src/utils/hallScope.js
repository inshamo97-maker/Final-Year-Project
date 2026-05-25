function toNumberSet(values = []) {
  return new Set(
    values
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v))
  );
}

function getItemHallId(item) {
  if (!item || typeof item !== "object") return null;
  if (item.hall_id !== undefined && item.hall_id !== null) return Number(item.hall_id);
  if (item.hallId !== undefined && item.hallId !== null) return Number(item.hallId);
  if (item.id !== undefined && item.id !== null) return Number(item.id); // exam_halls rows
  return null;
}

function filterByHallScope(data, user) {
  if (!Array.isArray(data)) return [];
  if (user?.role === "admin" || user?.isAdmin) return data;

  const allowedHallIds = toNumberSet(user?.hallIds || []);
  if (!allowedHallIds.size) return [];

  return data.filter((item) => allowedHallIds.has(getItemHallId(item)));
}

function canAccessHall(user, hallId) {
  if (user?.role === "admin" || user?.isAdmin) return true;
  const allowedHallIds = toNumberSet(user?.hallIds || []);
  return allowedHallIds.has(Number(hallId));
}

module.exports = {
  filterByHallScope,
  canAccessHall,
};

