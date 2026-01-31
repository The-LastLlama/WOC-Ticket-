const { loadConfig, saveConfig } = require("../../utils/ticketConfig");

module.exports = {
    name: "ticketedit",
    description: "Edit an existing ticket reason",
    userPerms: ["ADMINISTRATOR"],
    options: [
        {
            name: "reason",
            description: "Ticket reason ID",
            type: 3,
            required: true
        },
        {
            name: "field",
            description: "What to edit",
            type: 3,
            required: true,
            choices: [
                { name: "Label", value: "label" },
                { name: "Description", value: "description" },
                { name: "Add Staff Role", value: "addstaff" },
                { name: "Remove Staff Role", value: "removestaff" },
                { name: "Open Category", value: "opencategory" },
                { name: "Close Category", value: "closecategory" },
                { name: "Transcript Channel", value: "transcript" },
                { name: "Panel Channel", value: "panel" }
            ]
        },
        {
            name: "value",
            description: "New value (role/channel/text)",
            type: 3,
            required: false
        },
        {
            name: "role",
            description: "Staff role (for add/remove)",
            type: 8,
            required: false
        },
        {
            name: "channel",
            description: "Category / Channel",
            type: 7,
            required: false
        }
    ],

    run: async (client, interaction) => {
        const reasonId = interaction.options.getString("reason");
        const field = interaction.options.getString("field");
        const value = interaction.options.getString("value");
        const role = interaction.options.getRole("role");
        const channel = interaction.options.getChannel("channel");

        const data = loadConfig();
        const guildId = interaction.guild.id;

        if (!data.guilds[guildId]) {
            return interaction.reply({
                content: "❌ No ticket system configured for this server.",
                ephemeral: true
            });
        }

        const reason = data.guilds[guildId].reasons.find(r => r.id === reasonId);
        if (!reason) {
            return interaction.reply({
                content: "❌ Ticket reason not found.",
                ephemeral: true
            });
        }

        switch (field) {
            case "label":
                if (!value) return fail("Please provide a label.");
                reason.label = value;
                break;

            case "description":
                if (!value) return fail("Please provide a description.");
                reason.description = value;
                break;

            case "addstaff":
                if (!role) return fail("Please provide a role.");
                if (!reason.staffRoles.includes(role.id)) {
                    reason.staffRoles.push(role.id);
                }
                break;

            case "removestaff":
                if (!role) return fail("Please provide a role.");
                reason.staffRoles = reason.staffRoles.filter(r => r !== role.id);
                break;

            case "opencategory":
                if (!channel) return fail("Please provide a category.");
                reason.openCategory = channel.id;
                break;

            case "closecategory":
                if (!channel) return fail("Please provide a category.");
                reason.closeCategory = channel.id;
                break;

            case "transcript":
                if (!channel) return fail("Please provide a channel.");
                reason.transcriptChannel = channel.id;
                break;

            case "panel":
                if (!channel) return fail("Please provide a channel.");
                reason.panelChannel = channel.id;
                data.guilds[guildId].panelChannel = channel.id;
                break;
        }

        saveConfig(data);

        return interaction.reply({
            content: `✅ Ticket reason **${reasonId}** updated successfully.`,
            ephemeral: true
        });

        function fail(msg) {
            interaction.reply({ content: `❌ ${msg}`, ephemeral: true });
            throw new Error("Invalid input");
        }
    }
};
