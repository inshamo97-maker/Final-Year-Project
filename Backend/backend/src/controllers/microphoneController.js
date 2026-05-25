// Back-compat shim.
// The project currently has a misspelled controller filename `mircrophoneController.js`
// but routes import `microphoneController.js`. Re-export to keep runtime working.
module.exports = require("./mircrophoneController");

