const fs = require("fs");
const path = "./openedTickets.json";

function loadTickets() {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

function saveTickets(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = { loadTickets, saveTickets };
