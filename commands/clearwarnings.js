const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');
const Warning = require('../models/Warning');

module.exports = {
    name: 'clearwarnings',
    description: 'Clear all warnings for a user',
    usage: '!clearwarnings @user',
    requiredPermission: 4,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'clearwarnings')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user mentioned
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Please mention a user to clear warnings for.');
        }
        
        try {
            // Count active warnings
            const warningCount = await Warning.countDocuments({
                guildId: message.guild.id,
                userId: user.id,
                active: true
            });
            
            if (warningCount === 0) {
                return message.reply('❌ This user has no active warnings.');
            }
            
            // Clear all warnings
            await Warning.updateMany(
                {
                    guildId: message.guild.id,
                    userId: user.id,
                    active: true
                },
                { active: false }
            );
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('✅ Warnings Cleared')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Warnings Cleared', value: `${warningCount}`, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true }
                )
                .setTimestamp();
            
            const reply = await message.reply({ embeds: [embed] });
            
            // Log action
            await logAction(message.guild, 'clearwarnings', {
                user: user,
                moderator: message.author,
                warningsCleared: warningCount
            });
            
            // Delete command and reply after 5 seconds
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error clearing warnings:', error);
            message.reply('❌ An error occurred while trying to clear warnings.');
        }
    }
};
