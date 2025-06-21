const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');
const Warning = require('../models/Warning');

module.exports = {
    name: 'unwarn',
    description: 'Remove a specific warning from a user',
    usage: '!unwarn @user [warning number]',
    requiredPermission: 3,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'unwarn')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user mentioned
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Please mention a user to unwarn.');
        }
        
        const warningNumber = parseInt(args[1]);
        if (!warningNumber || warningNumber < 1) {
            return message.reply('❌ Please provide a valid warning number.');
        }
        
        try {
            // Find and remove the warning
            const warning = await Warning.findOneAndUpdate(
                {
                    guildId: message.guild.id,
                    userId: user.id,
                    warningId: warningNumber,
                    active: true
                },
                { active: false }
            );
            
            if (!warning) {
                return message.reply('❌ Warning not found or already removed.');
            }
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('✅ Warning Removed')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Warning #', value: `${warningNumber}`, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Original Reason', value: warning.reason, inline: false }
                )
                .setTimestamp();
            
            const reply = await message.reply({ embeds: [embed] });
            
            // Log action
            await logAction(message.guild, 'unwarn', {
                user: user,
                moderator: message.author,
                warningNumber: warningNumber,
                originalReason: warning.reason
            });
            
            // Delete command and reply after 5 seconds
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error unwarning user:', error);
            message.reply('❌ An error occurred while trying to remove the warning.');
        }
    }
};
