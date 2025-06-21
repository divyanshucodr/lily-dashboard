const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');

module.exports = {
    name: 'userinfo',
    description: 'Get information about a user',
    usage: '!userinfo @user',
    requiredPermission: 1,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'userinfo')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Get user (mentioned user or command author)
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);
        
        if (!member) {
            return message.reply('❌ User not found in this server.');
        }
        
        // Get user status
        const status = member.presence?.status || 'offline';
        const statusEmoji = {
            online: '🟢',
            idle: '🟡',
            dnd: '🔴',
            offline: '⚫'
        };
        
        // Get highest role
        const highestRole = member.roles.highest;
        
        // Calculate join position
        const members = await message.guild.members.fetch();
        const joinPosition = members
            .filter(m => m.joinedAt < member.joinedAt)
            .size + 1;
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('👤 User Information')
            .setColor(member.displayHexColor || '#0099FF')
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Username', value: user.tag, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Status', value: `${statusEmoji[status]} ${status.charAt(0).toUpperCase() + status.slice(1)}`, inline: true },
                { name: 'Nickname', value: member.nickname || 'None', inline: true },
                { name: 'Highest Role', value: highestRole.toString(), inline: true },
                { name: 'Join Position', value: `#${joinPosition}`, inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:F>`, inline: false },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>`, inline: false }
            )
            .setTimestamp();
        
        // Add roles if user has any
        const roles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.toString())
            .slice(0, 10); // Limit to 10 roles to avoid embed length issues
        
        if (roles.length > 0) {
            embed.addFields({
                name: `Roles (${member.roles.cache.size - 1})`,
                value: roles.join(', ') + (member.roles.cache.size > 11 ? '...' : ''),
                inline: false
            });
        }
        
        const reply = await message.reply({ embeds: [embed] });
        
        // Delete command and reply after 10 seconds
        setTimeout(() => {
            message.delete().catch(() => {});
            reply.delete().catch(() => {});
        }, 10000);
    }
};
