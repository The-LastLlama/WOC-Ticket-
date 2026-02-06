const Ticket = require("../../models/Ticket");
const { MessageActionRow, MessageButton } = require("discord.js");

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

        if (channel.type !== "GUILD_TEXT") {
            return interaction.reply({ content: "❌ Please select a valid text channel.", ephemeral: true });
        }

        const ticket = await Ticket.findOne({ channelId: channel.id });

        if (!ticket) {
            return interaction.reply({ content: "❌ This channel is not recognized as a ticket.", ephemeral: true });
        }

        if (ticket.claimerId) {
            return interaction.reply({ content: `❌ This ticket has already been claimed by <@${ticket.claimerId}>.`, ephemeral: true });
        }

        ticket.claimerId = interaction.user.id;
        await ticket.save();

        // Enable the close button if it exists
        if (channel.messages) {
            const messages = await channel.messages.fetch({ limit: 10 });
            const lastMsg = messages.find(m => m.components.length && m.author.id === client.user.id);

            if (lastMsg) {
                const row = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setCustomId("ticket-claimed")
                        .setLabel(`Claimed by ${interaction.user.username}`)
                        .setStyle("SECONDARY")
                        .setDisabled(true),
                    new MessageButton()
                        .setCustomId("ticket-close")
                        .setLabel("Close Ticket")
                        .setStyle("DANGER")
                );

                await lastMsg.edit({ components: [row] });
            }
        }

        await channel.send(`✅ <@${interaction.user.id}> has claimed this ticket via /claim!`);
        await interaction.reply({ content: `✅ You have claimed ${channel}.`, ephemeral: true });
    }
};