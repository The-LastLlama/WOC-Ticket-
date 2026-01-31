// commands/ticket.js
const fs = require("fs");
const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require("discord.js");
const { loadConfig, saveConfig } = require("../../utils/ticketConfig");

module.exports = {
    name: "ticket",
    description: "Ticket system setup",
    options: [
        {
            name: "setup",
            description: "Ticket setup commands",
            type: 2,
            options: [
                {
                    name: "add",
                    description: "Add a ticket reason",
                    type: 1,
                    options: [
                        { name: "reason", description: "Ticket reason ID", type: 3, required: true },
                        { name: "label", description: "Panel Title", type: 3, required: true },
                        { name: "description", description: "Embed Description", type: 3, required: true },

                        // 🔥 MULTI ROLE INPUT
                        {
                            name: "staff_roles",
                            description: "Mention one or more staff roles",
                            type: 3,
                            required: true
                        },

                        { name: "open_category", description: "Open ticket category", type: 7, required: true, channel_types: [4] },
                        { name: "close_category", description: "Close ticket category", type: 7, required: true, channel_types: [4] },
                        { name: "transcript", description: "Transcript channel", type: 7, required: true },
                        { name: "panel_channel", description: "Panel channel", type: 7, required: true }
                    ]
                }
            ]
        }
    ],
    userPerms: ["ADMINISTRATOR"],

    run: async (client, interaction) => {
        const reasonId = interaction.options.getString("reason");
        const label = interaction.options.getString("label");
        const description = interaction.options.getString("description");
        const rolesInput = interaction.options.getString("staff_roles");

        const openCategory = interaction.options.getChannel("open_category");
        const closeCategory = interaction.options.getChannel("close_category");
        const transcript = interaction.options.getChannel("transcript");
        const panelChannel = interaction.options.getChannel("panel_channel");
        const guildId = interaction.guild.id;

        // 🔍 Extract role IDs from mentions
        const staffRoles = [...rolesInput.matchAll(/<@&(\d+)>/g)].map(r => r[1]);

        if (!staffRoles.length) {
            return interaction.reply({
                content: "❌ Please mention at least one valid staff role.",
                ephemeral: true
            });
        }

        const data = loadConfig();
        if (!data.guilds[guildId]) {
            data.guilds[guildId] = { panelChannel: panelChannel.id, reasons: [] };
        } else {
            data.guilds[guildId].panelChannel = panelChannel.id;
        }

        if (data.guilds[guildId].reasons.some(r => r.id === reasonId)) {
            return interaction.reply({
                content: "❌ That reason ID already exists.",
                ephemeral: true
            });
        }

        // ✅ SAVE MULTIPLE ROLES
        data.guilds[guildId].reasons.push({
            id: reasonId,
            label,
            description,
            staffRoles, // 🔥 ARRAY OF ROLE IDS
            openCategory: openCategory.id,
            closeCategory: closeCategory.id,
            transcriptChannel: transcript.id,
            panelChannel: panelChannel.id
        });

        saveConfig(data);

        // 🔽 Build dropdown
      const options = data.guilds[guildId].reasons.map(r => ({
    label: r.label || "No Label",
    description: (r.description || "No description provided").slice(0, 100),
    value: r.id
}));


        const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("ticket_dropdown")
                .setPlaceholder("Select a ticket reason...")
                .addOptions(options)
        );

        const embed = new MessageEmbed()
            .setTitle("📩 Open a Ticket")
            .setDescription("Select a reason from the dropdown below.")
            .setColor(client.config.embedColor || "#00FFFF");

        try {
            const fetched = await panelChannel.messages.fetch({ limit: 20 });
            const panelMsg = fetched.find(
                m => m.author.id === client.user.id && m.components.length
            );

            if (panelMsg) {
                await panelMsg.edit({ embeds: [embed], components: [row] });
            } else {
                await panelChannel.send({ embeds: [embed], components: [row] });
            }
        } catch (err) {
            console.error("Panel update failed:", err);
        }

        interaction.reply({
            content: "✅ Ticket reason added with multiple staff roles!",
            ephemeral: true
        });
    }
};
