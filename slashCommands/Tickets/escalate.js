const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "escalate",
    description: "Escalate a ticket to another category",
    options: [
        {
            name: "category",
            description: "Category to move the ticket to",
            type: 7, // CHANNEL
            required: true,
            channel_types: [4] // CATEGORY ONLY
        },
        {
            name: "reason",
            description: "Reason for escalation",
            type: 3, // STRING
            required: false
        }
    ],

    userPerms: ["MANAGE_CHANNELS"],

    run: async (client, interaction) => {
        const newCategory = interaction.options.getChannel("category");
        const reason = interaction.options.getString("reason") || "No reason provided";

        const channel = interaction.channel;

        // ❌ Must be a ticket channel (basic check)
        if (!channel.parentId) {
            return interaction.reply({
                content: "❌ This command can only be used inside a ticket channel.",
                ephemeral: true
            });
        }

        try {
            await channel.setParent(newCategory.id, { lockPermissions: false });

            const embed = new MessageEmbed()
                .setTitle("🚨 Ticket Escalated")
                .addField("Escalated By", `<@${interaction.user.id}>`, true)
                .addField("New Category", newCategory.name, true)
                .addField("Reason", reason)
                .setColor("ORANGE")
                .setTimestamp();

            await channel.send({ embeds: [embed] });

            await interaction.reply({
                content: `✅ Ticket successfully escalated to **${newCategory.name}**.`,
                ephemeral: true
            });

        } catch (err) {
            console.error(err);
            interaction.reply({
                content: "❌ Failed to escalate the ticket.",
                ephemeral: true
            });
        }
    }
};
