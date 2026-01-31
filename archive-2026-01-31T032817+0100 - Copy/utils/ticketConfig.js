const fs = require("fs");
const path = "./ticketConfig.json";

function loadConfig() {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({ guilds: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function saveConfig(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = { loadConfig, saveConfig };
