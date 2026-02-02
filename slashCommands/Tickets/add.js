module.exports = {
    name: "add",
    description: "Add user to ticket!",
    category: "Tickets",
    userPerms: ["SEND_MESSAGES"],
    ownerOnly: false,
    options: [
        {
            name: "user",
            description: "Write the user you want to add to the ticket!",
            type: "USER",
            required: true
        }
    ],
    run: async (client, interaction, args) => {
        const user = interaction.options.getUser("user");

        if (!interaction.channel.name.includes("ticket") && !interaction.channel.name.includes("close")) {
            return interaction.reply({ content: "❌ This command can only be used on tickets!", ephemeral: true });
        }

        // Optional: Only claimer or staff can add
        if (interaction.channel.claimerId && interaction.user.id !== interaction.channel.claimerId) {
            return interaction.reply({ content: "❌ Only the staff member who claimed this ticket can add users.", ephemeral: true });
        }

        await interaction.channel.permissionOverwrites.edit(user.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
            ATTACH_FILES: true,
            READ_MESSAGE_HISTORY: true
        });

        interaction.reply({ content: `<@${user.id}> was added to the ticket by <@${interaction.user.id}>`, ephemeral: true });
    }
};
