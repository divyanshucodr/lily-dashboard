const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');

module.exports = {
    name: 'purge',
    description: 'Delete a specified amount of messages',
    usage: '!purge [amount]',
    requiredPermission: 3,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'purge')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if amount is provided
        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) {
            return message.reply('❌ Please provide a valid number between 1 and 100.');
        }
        
        try {
            // Delete the command message first
            await message.delete();
            
            // Fetch and delete messages
            const messages = await message.channel.messages.fetch({ limit: amount });
            const deletedMessages = await message.channel.bulkDelete(messages, true);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('✅ Messages Purged')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'Channel', value: `${message.channel}`, inline: true },
                    { name: 'Messages Deleted', value: `${deletedMessages.size}`, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true }
                )
                .setTimestamp();
            
            const reply = await message.channel.send({ embeds: [embed] });
            
            // Log action
            await logAction(message.guild, 'purge', {
                channel: message.channel,
                moderator: message.author,
                messagesDeleted: deletedMessages.size
            });
            
            // Delete reply after 5 seconds
            setTimeout(() => {
                reply.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error purging messages:', error);
            message.channel.send('❌ An error occurred while trying to purge messages. Note: Messages older than 14 days cannot be bulk deleted.');
        }
    }
};
