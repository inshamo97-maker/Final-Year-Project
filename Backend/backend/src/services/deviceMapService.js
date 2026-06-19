const pool = require("../db");

function assignCameraRole(camera) {
  const position = (camera.position || "").toLowerCase().trim();
  if (position === "front") return "attendance_camera";
  if (position === "back")  return "cheating_camera";
  if (position === "side")  return "seating_camera";
  return "general_camera";
}

function assignMicrophoneRole(microphone) {
  const sensitivity = (microphone.sensitivity || "").toLowerCase().trim();
  if (sensitivity === "high") return "speech_detection_mic";
  if (microphone.row_number != null && microphone.row_number < 3) return "front_audio_mic";
  return "general_mic";
}

function assignSpeakerRole(speaker) {
  if (speaker.volume_level != null && speaker.volume_level > 70) return "alert_speaker";
  return "instruction_speaker";
}

async function getDeviceMapForHall(hallId) {
  const [camerasResult, microphonesResult, speakersResult] = await Promise.all([
    pool.query(
      "SELECT id, position, is_active, ip_address, model, hall_id FROM cameras WHERE hall_id = $1 ORDER BY id ASC",
      [hallId]
    ),
    pool.query(
      "SELECT id, is_active, range, sensitivity, hall_id, row_number, column_number FROM microphones WHERE hall_id = $1 ORDER BY id ASC",
      [hallId]
    ),
    pool.query(
      "SELECT id, label, status, ip_address, volume_level, last_active_timestamp, hall_id FROM speakers WHERE hall_id = $1 ORDER BY id ASC",
      [hallId]
    ),
  ]);

  // Flat camera list with role attached
  const cameras = camerasResult.rows.map((camera) => ({
    id:         camera.id,
    position:   camera.position,
    is_active:  camera.is_active,
    ip_address: camera.ip_address,
    model:      camera.model,
    hall_id:    camera.hall_id,
    role:       assignCameraRole(camera),
  }));

  // Microphones grouped by role
  const microphones = { speech_detection_mic: [], front_audio_mic: [], general_mic: [] };
  for (const mic of microphonesResult.rows) {
    microphones[assignMicrophoneRole(mic)].push({
      id:           mic.id,
      is_active:    mic.is_active,
      range:        mic.range,
      sensitivity:  mic.sensitivity,
      row_number:   mic.row_number,
      column_number: mic.column_number,
    });
  }

  // Speakers grouped by role
  const speakers = { alert_speaker: [], instruction_speaker: [] };
  for (const speaker of speakersResult.rows) {
    speakers[assignSpeakerRole(speaker)].push({
      id:                   speaker.id,
      label:                speaker.label,
      status:               speaker.status,
      ip_address:           speaker.ip_address,
      volume_level:         speaker.volume_level,
      last_active_timestamp: speaker.last_active_timestamp,
    });
  }

  return { hall_id: hallId, cameras, microphones, speakers };
}

module.exports = { getDeviceMapForHall, assignCameraRole, assignMicrophoneRole, assignSpeakerRole };
