const pool = require("../db");

/**
 * Assign camera role based on position field
 * @param {object} camera - Camera object from database
 * @returns {string} role
 */
function assignCameraRole(camera) {
  const position = (camera.position || "").toLowerCase().trim();
  
  if (position === "front") return "attendance_camera";
  if (position === "back") return "cheating_camera";
  if (position === "side") return "seating_camera";
  return "general_camera";
}

/**
 * Assign microphone role based on sensitivity and row_number
 * @param {object} microphone - Microphone object from database
 * @returns {string} role
 */
function assignMicrophoneRole(microphone) {
  const sensitivity = (microphone.sensitivity || "").toLowerCase().trim();
  const rowNumber = microphone.row_number;

  if (sensitivity === "high") return "speech_detection_mic";
  if (rowNumber !== null && rowNumber !== undefined && rowNumber < 3) {
    return "front_audio_mic";
  }
  return "general_mic";
}

/**
 * Assign speaker role based on volume_level
 * @param {object} speaker - Speaker object from database
 * @returns {string} role
 */
function assignSpeakerRole(speaker) {
  const volumeLevel = speaker.volume_level;

  if (volumeLevel !== null && volumeLevel !== undefined && volumeLevel > 70) {
    return "alert_speaker";
  }
  return "instruction_speaker";
}

/**
 * Fetch and organize devices by role for a specific hall
 * @param {number} hallId - Hall ID
 * @returns {Promise<object>} Device map organized by role
 */
async function getDeviceMapForHall(hallId) {
  // Fetch cameras
  const camerasResult = await pool.query(
    "SELECT id, position, is_active, ip_address, model, hall_id FROM cameras WHERE hall_id = $1 ORDER BY id ASC",
    [hallId]
  );
  const cameras = camerasResult.rows;

  // Fetch microphones
  const microphonesResult = await pool.query(
    "SELECT id, is_active, range, sensitivity, hall_id, row_number, column_number FROM microphones WHERE hall_id = $1 ORDER BY id ASC",
    [hallId]
  );
  const microphones = microphonesResult.rows;

  // Fetch speakers
  const speakersResult = await pool.query(
    "SELECT id, label, status, ip_address, volume_level, last_active_timestamp, hall_id FROM speakers WHERE hall_id = $1 ORDER BY id ASC",
    [hallId]
  );
  const speakers = speakersResult.rows;

  // Build role-based camera map
 // Build FLAT camera list (FIXED)
const camerasList = cameras.map((camera) => {
  const role = assignCameraRole(camera);

  return {
    id: camera.id,
    position: camera.position,
    is_active: camera.is_active,
    ip_address: camera.ip_address,
    model: camera.model,
    hall_id: camera.hall_id
  };
});

  cameras.forEach((camera) => {
    const role = assignCameraRole(camera);
    camerasByRole[role].push({
      id: camera.id,
      position: camera.position,
      is_active: camera.is_active,
      ip_address: camera.ip_address,
      model: camera.model,
    });
  });

  // Build role-based microphone map
  const microphonesByRole = {
    speech_detection_mic: [],
    front_audio_mic: [],
    general_mic: [],
  };

  microphones.forEach((mic) => {
    const role = assignMicrophoneRole(mic);
    microphonesByRole[role].push({
      id: mic.id,
      is_active: mic.is_active,
      range: mic.range,
      sensitivity: mic.sensitivity,
      row_number: mic.row_number,
      column_number: mic.column_number,
    });
  });

  // Build role-based speaker map
  const speakersByRole = {
    alert_speaker: [],
    instruction_speaker: [],
  };

  speakers.forEach((speaker) => {
    const role = assignSpeakerRole(speaker);
    speakersByRole[role].push({
      id: speaker.id,
      label: speaker.label,
      status: speaker.status,
      ip_address: speaker.ip_address,
      volume_level: speaker.volume_level,
      last_active_timestamp: speaker.last_active_timestamp,
    });
  });

  // Return structured response
  return {
    hall_id: hallId,
    cameras: camerasList,
    microphones: microphonesByRole,
    speakers: speakersByRole,
  };
}

module.exports = { getDeviceMapForHall };
