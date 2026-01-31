const fs = require("fs");
const sourcebin = require("sourcebin_js");
const { loadTickets, saveTickets } = require("../../utils/ticketStore");
const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {
        /* ================= DROPDOWN TICKET ================= */
        if (interaction.isSelectMenu() && interaction.customId === "ticket_dropdown") {
            const selectedId = interaction.values[0];

            const data = JSON.parse(fs.readFileSync("./ticketConfig.json", "utf8"));
            const guildConfig = data.guilds[interaction.guild.id];
            if (!guildConfig) return interaction.reply({ content: "❌ Guild is not configured.", ephemeral: true });

            const reason = guildConfig.reasons.find(r => r.id === selectedId);
            if (!reason) return interaction.reply({ content: "❌ Invalid ticket reason.", ephemeral: true });

            // Check if user already has a ticket
            const existing = interaction.guild.channels.cache.find(
                c => c.topic === interaction.user.id && c.name.startsWith("ticket-")
            );
            if (existing) return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });

            // Create ticket channel
            const channel = await interaction.guild.channels.create(`ticket-${interaction.user.username}`.toLowerCase(), {
                type: "GUILD_TEXT",
                parent: reason.openCategory,
                topic: interaction.user.id,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ["VIEW_CHANNEL"] },
                    { id: interaction.user.id, allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"] },
                    ...reason.staffRoles.map(r => ({
                        id: r,
                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES"]
                    }))
                ]
            });

            // Save ticket
            const tickets = loadTickets();
            tickets[channel.id] = { ownerId: interaction.user.id, claimerId: null, reasonId: reason.id, closed: false };
            saveTickets(tickets);

            // Buttons for ticket
            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("ticket-claim").setLabel("Claim Ticket").setStyle("PRIMARY"),
                new MessageButton().setCustomId("ticket-close").setLabel("Close Ticket").setStyle("DANGER").setDisabled(true)
            );

            // Ticket embed
            const embed = new MessageEmbed()
                .setTitle(reason.label)
                .setDescription(`Hello <@${interaction.user.id}>, a staff member will assist you shortly.`)
                .setColor(client.config.embedColor);

            await channel.send({
                content: reason.staffRoles.map(r => `<@&${r}>`).join(" "),
                embeds: [embed],
                components: [row]
            });

            return interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
        }

        /* ================= CLAIM ================= */
if (interaction.isButton() && interaction.customId === "ticket-claim") {
    const tickets = loadTickets();
    const ticket = tickets[interaction.channel.id];

    if (!ticket || ticket.claimerId) {
        return interaction.reply({
            content: "❌ Ticket already claimed or invalid.",
            ephemeral: true
        });
    }

    /* LOAD CONFIG */
    const data = JSON.parse(fs.readFileSync("./ticketConfig.json", "utf8"));
    const reason = data.guilds[interaction.guild.id].reasons.find(
        r => r.id === ticket.reasonId
    );

    if (!reason) {
        return interaction.reply({
            content: "❌ Ticket configuration not found.",
            ephemeral: true
        });
    }

    /* ROLE CHECK */
    const hasStaffRole = interaction.member.roles.cache.some(role =>
        reason.staffRoles.includes(role.id)
    );

    if (!hasStaffRole) {
        return interaction.reply({
            content: "❌ You are not authorized to claim this ticket. Only the person who has the role can claim",
            ephemeral: true
        });
    }

    /* CLAIM */
    ticket.claimerId = interaction.user.id;
    saveTickets(tickets);

    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("ticket-claimed")
            .setLabel("Claimed")
            .setStyle("SECONDARY")
            .setDisabled(true),
        new MessageButton()
            .setCustomId("ticket-close")
            .setLabel("Close Ticket")
            .setStyle("DANGER")
    );

    await interaction.message.edit({ components: [row] });
    await interaction.channel.send(`✅ Claimed by <@${interaction.user.id}>`);

    return interaction.deferUpdate();
}

        /* ================= CLOSE ================= */
        if (interaction.isButton() && interaction.customId === "ticket-close") {
            const tickets = loadTickets();
            const ticket = tickets[interaction.channel.id];

            if (!ticket || ticket.claimerId !== interaction.user.id)
                return interaction.reply({ content: "❌ Only the claimer can close this ticket.", ephemeral: true });

            const data = JSON.parse(fs.readFileSync("./ticketConfig.json", "utf8"));
            const reason = data.guilds[interaction.guild.id]?.reasons.find(r => r.id === ticket.reasonId);
            if (!reason) return interaction.reply({ content: "❌ Could not find ticket reason config.", ephemeral: true });

            ticket.closed = true;
            saveTickets(tickets);

            await interaction.channel.setParent(reason.closeCategory);
            await interaction.channel.permissionOverwrites.edit(ticket.ownerId, { VIEW_CHANNEL: false });

            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("ticket-delete").setLabel("Delete Ticket").setStyle("DANGER")
            );

            await interaction.channel.send({
                embeds: [new MessageEmbed().setTitle("Ticket Closed").setDescription(`Closed by <@${interaction.user.id}>`).setColor("RED")],
                components: [row]
            });

            return interaction.deferUpdate();
        }

        /* ================= DELETE + TRANSCRIPT ================= */
        if (interaction.isButton() && interaction.customId === "ticket-delete") {
            const tickets = loadTickets();
            const ticket = tickets[interaction.channel.id];
            if (!ticket) return;

            const data = JSON.parse(fs.readFileSync("./ticketConfig.json", "utf8"));
            const reason = data.guilds[interaction.guild.id]?.reasons.find(r => r.id === ticket.reasonId);
            if (!reason) return;

            const transcriptChannel = interaction.guild.channels.cache.get(reason.transcriptChannel);

            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const transcript = messages.reverse().map(
                m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content || "[Attachment / Embed]"}`
            ).join("\n");

            const bin = await sourcebin.create([{
                name: `ticket-${interaction.channel.id}.txt`,
                content: transcript || "No messages",
                languageId: "text"
            }], { title: "Ticket Transcript", description: `Transcript for ${interaction.channel.name}` });

            if (transcriptChannel) {
                transcriptChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setTitle("📄 Ticket Transcript")
                            .addField("Ticket", interaction.channel.name, true)
                            .addField("Closed By", `<@${interaction.user.id}>`, true)
                            .addField("Transcript", `[Click Here](${bin.url})`)
                            .setColor(client.config.embedColor)
                    ]
                });
            }

            const owner = await client.users.fetch(ticket.ownerId).catch(() => null);
            if (owner) owner.send(`📄 Your ticket transcript:\n${bin.url}`).catch(() => {});

            delete tickets[interaction.channel.id];
            saveTickets(tickets);

            await interaction.reply({ content: "🗑️ Deleting ticket...", ephemeral: true });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }
    }
};
