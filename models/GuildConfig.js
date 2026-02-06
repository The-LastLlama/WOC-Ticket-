const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    guildId: String,
    panelChannel: String,
    reasons: [{
        id: String,
        label: String,
        description: String,
        question: String, 
        staffRoles: [String],
        openCategory: String,
        closeCategory: String,
        transcriptChannel: String,
        panelChannel: String
    }]
});

module.exports = mongoose.model('GuildConfig', configSchema);