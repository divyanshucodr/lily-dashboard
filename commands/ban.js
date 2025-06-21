const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');
const { sendDM } = require('../utils/dm');

module.exports = {
    name: 'ban',
    description: 'Ban a user from the server',
    usage: '!ban @user [reason]',
    requiredPermission: 4,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'ban')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user mentioned
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Please mention a user to ban.');
        }
        
        const member = message.guild.members.cache.get(user.id);
        
        // Check if user can be banned
        if (member && !member.bannable) {
            return message.reply('❌ I cannot ban this user. They may have higher permissions.');
        }
        
        // Check if user is trying to ban themselves
        if (user.id === message.author.id) {
            return message.reply('❌ You cannot ban yourself.');
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            // Send DM to user (if they're in the server)
            if (member) {
                await sendDM(user, {
                    title: '🔨 You have been banned',
                    fields: [
                        { name: 'Server', value: message.guild.name, inline: true },
                        { name: 'Moderator', value: message.author.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    ],
                    color: 0xFF0000
                });
            }
            
            // Ban the user
            await message.guild.members.ban(user, { reason, deleteMessageDays: 1 });
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('✅ User Banned')
                .setColor(0xFF0000)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            const reply = await message.reply({ embeds: [embed] });
            
            // Log action
            await logAction(message.guild, 'ban', {
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
            console.error('Error banning user:', error);
            message.reply('❌ An error occurred while trying to ban the user.');
        }
    }
};
