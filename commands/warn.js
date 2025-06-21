const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');
const { sendDM } = require('../utils/dm');
const Warning = require('../models/Warning');

module.exports = {
    name: 'warn',
    description: 'Warn a user',
    usage: '!warn @user [reason]',
    requiredPermission: 1,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'warn')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user mentioned
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Please mention a user to warn.');
        }
        
        // Check if user is trying to warn themselves
        if (user.id === message.author.id) {
            return message.reply('❌ You cannot warn yourself.');
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            // Get warning count for auto-incrementing warning ID
            const warningCount = await Warning.countDocuments({
                guildId: message.guild.id,
                userId: user.id
            });
            
            // Create warning record
            const warning = new Warning({
                guildId: message.guild.id,
                userId: user.id,
                moderatorId: message.author.id,
                reason: reason,
                warningId: warningCount + 1
            });
            await warning.save();
            
            // Send DM to user
            await sendDM(user, {
                title: '⚠️ You have been warned',
                fields: [
                    { name: 'Server', value: message.guild.name, inline: true },
                    { name: 'Warning #', value: `${warningCount + 1}`, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                ],
                color: 0xFFFF00
            });
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('✅ User Warned')
                .setColor(0xFFFF00)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Warning #', value: `${warningCount + 1}`, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            const reply = await message.reply({ embeds: [embed] });
            
            // Log action
            await logAction(message.guild, 'warn', {
                user: user,
                moderator: message.author,
                reason: reason,
                warningNumber: warningCount + 1
            });
            
            // Delete command and reply after 5 seconds
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error warning user:', error);
            message.reply('❌ An error occurred while trying to warn the user.');
        }
    }
};
