module.exports = {
    name: "rename",
    options: [
        {
            name: "name",
            description: "Enter the new name for this ticket channel",
            type: "STRING",
            required: true
        }
    ],
    category: "Tickets",
    description: "Rename the ticket channel!",
    userPerms: ["MANAGE_CHANNELS"],
    ownerOnly: false,
    run: async (client, interaction, args) => {
        // Get the new name from the command
        let newName = interaction.options.getString("name");

        // Check if the current channel is a ticket
        if(interaction.channel.name.includes("ticket") || interaction.channel.name.includes("close")) {
            try {
                await interaction.channel.setName(newName);
                interaction.reply({ content: `✅ Ticket channel has been renamed to **${newName}**` });
            } catch (err) {
                console.log(err);
                interaction.reply({ content: "❌ I couldn't rename this channel. Do I have permission?", ephemeral: true });
            }
        } else {
            interaction.reply({ content: "This command can only be used in ticket channels!", ephemeral: true });
        }
    }
}
