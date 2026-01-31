const {
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require("discord.js");
const { loadConfig } = require("../../utils/ticketConfig");

const PER_PAGE = 5;

module.exports = {
    name: "ticketlist",
    description: "List all ticket reasons configured for this server",
    userPerms: ["ADMINISTRATOR"],

    run: async (client, interaction) => {
        const data = loadConfig();
        const guildId = interaction.guild.id;
        const guildData = data.guilds[guildId];

        if (!guildData || !guildData.reasons || guildData.reasons.length === 0) {
            return interaction.reply({
                content: "❌ No ticket reasons are configured for this server.",
                ephemeral: true
            });
        }

        let page = 0;
        const totalPages = Math.ceil(guildData.reasons.length / PER_PAGE);

        const buildEmbed = (page) => {
            const start = page * PER_PAGE;
            const reasons = guildData.reasons.slice(start, start + PER_PAGE);

            const embed = new MessageEmbed()
                .setTitle("🎫 Ticket Reasons")
                .setColor(client.config?.embedColor || "#00FFFF")
                .setFooter({
                    text: `Page ${page + 1} / ${totalPages} • Total: ${guildData.reasons.length}`
                });

            reasons.forEach((r, i) => {
                embed.addField(
                    `#${start + i + 1} • ${r.label}`,
                    `**Reason ID:** \`${r.id}\`
**Description:** ${r.description || "None"}
**Staff Role(s):** ${
    r.staffRoles?.length
        ? r.staffRoles.map(id => `<@&${id}>`).join(", ")
        : "None"
}
**Open Category:** ${r.openCategory ? `<#${r.openCategory}>` : "None"}
**Close Category:** ${r.closeCategory ? `<#${r.closeCategory}>` : "None"}
**Transcript Channel:** ${r.transcriptChannel ? `<#${r.transcriptChannel}>` : "None"}
**Panel Channel:** <#${r.panelChannel}>`
                );
            });

            return embed;
        };

        const buildRow = (page) => {
            return new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("ticket_prev")
                    .setLabel("⬅ Prev")
                    .setStyle("SECONDARY")
                    .setDisabled(page === 0),
                new MessageButton()
                    .setCustomId("ticket_next")
                    .setLabel("Next ➡")
                    .setStyle("SECONDARY")
                    .setDisabled(page === totalPages - 1)
            );
        };

        const message = await interaction.reply({
            embeds: [buildEmbed(page)],
            components: [buildRow(page)],
            ephemeral: true,
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            time: 5 * 60 * 1000 // 5 minutes
        });

        collector.on("collect", async (btn) => {
            if (btn.user.id !== interaction.user.id) {
                return btn.reply({
                    content: "❌ This menu is not for you.",
                    ephemeral: true
                });
            }

            if (btn.customId === "ticket_prev") page--;
            if (btn.customId === "ticket_next") page++;

            await btn.update({
                embeds: [buildEmbed(page)],
                components: [buildRow(page)]
            });
        });

        collector.on("end", async () => {
            try {
                await message.edit({ components: [] });
            } catch {}
        });
    }
};
