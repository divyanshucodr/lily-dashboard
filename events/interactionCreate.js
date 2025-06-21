const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    execute(interaction) {
        if (!interaction.isButton()) return;
        
        // Handle report button interactions
        if (interaction.customId.startsWith('report_')) {
            handleReportButtons(interaction);
        }
    }
};

async function handleReportButtons(interaction) {
    const [action, type, reportId] = interaction.customId.split('_');
    
    try {
        const embed = interaction.message.embeds[0];
        const newEmbed = new EmbedBuilder(embed.data);
        
        switch (type) {
            case 'review':
                // Mark as reviewed
                newEmbed.setFields(
                    ...embed.fields.map(field => 
                        field.name === 'Status' 
                            ? { ...field, value: '✅ Reviewed by ' + interaction.user.tag }
                            : field
                    )
                );
                newEmbed.setColor(0x00FF00);
                
                await interaction.update({
                    embeds: [newEmbed],
                    components: [] // Remove buttons
                });
                
                await interaction.followUp({
                    content: `✅ Report ${reportId} marked as reviewed by ${interaction.user.tag}`,
                    ephemeral: true
                });
                break;
                
            case 'assign':
                // Assign moderator
                newEmbed.setFields(
                    ...embed.fields.map(field => 
                        field.name === 'Status' 
                            ? { ...field, value: '👮 Assigned to ' + interaction.user.tag }
                            : field
                    )
                );
                newEmbed.setColor(0x0099FF);
                
                await interaction.update({
                    embeds: [newEmbed]
                });
                
                await interaction.followUp({
                    content: `👮 Report ${reportId} assigned to ${interaction.user.tag}`,
                    ephemeral: true
                });
                break;
                
            case 'action':
                // Action taken
                newEmbed.setFields(
                    ...embed.fields.map(field => 
                        field.name === 'Status' 
                            ? { ...field, value: '⚡ Action taken by ' + interaction.user.tag }
                            : field
                    )
                );
                newEmbed.setColor(0xFF4500);
                
                await interaction.update({
                    embeds: [newEmbed],
                    components: [] // Remove buttons
                });
                
                await interaction.followUp({
                    content: `⚡ Action taken on report ${reportId} by ${interaction.user.tag}`,
                    ephemeral: true
                });
                break;
        }
    } catch (error) {
        console.error('Error handling report button:', error);
        await interaction.reply({
            content: '❌ An error occurred while processing your request.',
            ephemeral: true
        });
    }
}
