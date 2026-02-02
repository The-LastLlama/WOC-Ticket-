const { loadTickets, saveTickets } = require("../../utils/ticketStore");

module.exports = {
    name: "claim",
    description: "Claim a ticket to handle it",
    category: "Tickets",
    userPerms: ["SEND_MESSAGES"],
    ownerOnly: false,
    options: [
        {
            name: "channel",
            description: "Select the ticket channel you want to claim",
            type: "CHANNEL",
            required: true
        }
    ],

    run: async (client, interaction, args) => {
        const channel = interaction.options.getChannel("channel");

        // Ensure it's a text channel
        if (channel.type !== "GUILD_TEXT") {
            return interaction.reply({ content: "❌ Please select a valid text channel.", ephemeral: true });
        }

        // Load opened tickets
        const tickets = loadTickets();
        const ticket = tickets[channel.id];

        if (!ticket) {
            return interaction.reply({ content: "❌ This channel is not recognized as a ticket.", ephemeral: true });
        }

        if (ticket.claimerId) {
            return interaction.reply({ content: `❌ This ticket has already been claimed by <@${ticket.claimerId}>.`, ephemeral: true });
        }

        // Save claimer to JSON
        ticket.claimerId = interaction.user.id;
        saveTickets(tickets);

        // Enable the close button if it exists
        if (channel.messages) {
            const messages = await channel.messages.fetch({ limit: 10 });
            const lastMsg = messages.find(m => m.components.length);

            if (lastMsg) {
                const row = lastMsg.components[0];
                const claimBtn = row.components.find(c => c.customId === "ticket-claim");
                const closeBtn = row.components.find(c => c.customId === "ticket-close");

                if (claimBtn && closeBtn) {
                    claimBtn.setDisabled(true);
                    closeBtn.setDisabled(false);

                    await lastMsg.edit({ components: [row] });
                }
            }
        }

        await channel.send(`✅ <@${interaction.user.id}> has claimed this ticket via /claim!`);
        await interaction.reply({ content: `✅ You have claimed ${channel}.`, ephemeral: true });
    }
};
