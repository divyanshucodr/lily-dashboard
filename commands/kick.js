const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');
const { sendDM } = require('../utils/dm');

module.exports = {
    name: 'kick',
    description: 'Kick a user from the server',
    usage: '!kick @user [reason]',
    requiredPermission: 4,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'kick')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user mentioned
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Please mention a user to kick.');
        }
        
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ User not found in this server.');
        }
        
        // Check if user can be kicked
        if (!member.kickable) {
            return message.reply('❌ I cannot kick this user. They may have higher permissions.');
        }
        
        // Check if user is trying to kick themselves
        if (user.id === message.author.id) {
            return message.reply('❌ You cannot kick yourself.');
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            // Send DM to user
            await sendDM(user, {
                title: '🦵 You have been kicked',
                fields: [
                    { name: 'Server', value: message.guild.name, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                ],
                color: 0xFFA500
            });
            
            // Kick the user
            await member.kick(reason);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('✅ User Kicked')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            const reply = await message.reply({ embeds: [embed] });
            
            // Log action
            await logAction(message.guild, 'kick', {
                user: user,
                moderator: message.author,
                reason: reason
            });
            
            // Delete command and reply after 5 seconds
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error kicking user:', error);
            message.reply('❌ An error occurred while trying to kick the user.');
        }
    }
};
