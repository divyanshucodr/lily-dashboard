const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');

module.exports = {
    name: 'modcommands',
    description: 'List all available moderation commands',
    usage: '!modcommands',
    requiredPermission: 1,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'modcommands')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        const commands = [
            { name: '!kick @user [reason]', description: 'Kick a user from the server', permission: 'Moderator+' },
            { name: '!ban @user [reason]', description: 'Ban a user from the server', permission: 'Moderator+' },
            { name: '!unban [userID]', description: 'Unban a user from the server', permission: 'Moderator+' },
            { name: '!mute @user [duration] [reason]', description: 'Mute a user for specified time', permission: 'Jr Moderator+' },
            { name: '!unmute @user', description: 'Unmute a user', permission: 'Jr Moderator+' },
            { name: '!warn @user [reason]', description: 'Warn a user', permission: 'All Staff' },
            { name: '!unwarn @user [warning#]', description: 'Remove a specific warning', permission: 'Jr Moderator+' },
            { name: '!clearwarnings @user', description: 'Clear all warnings for a user', permission: 'Moderator+' },
            { name: '!warnings @user', description: 'View warnings for a user', permission: 'All Staff' },
            { name: '!purge [amount]', description: 'Delete specified amount of messages', permission: 'Jr Moderator+' },
            { name: '!userinfo @user', description: 'Get information about a user', permission: 'All Staff' },
            { name: '!serverinfo', description: 'Get information about the server', permission: 'All Staff' },
            { name: '!report @user reason location evidence', description: 'Report a user', permission: 'All Staff' }
        ];
        
        const embed = new EmbedBuilder()
            .setTitle('🔧 Moderation Commands')
            .setDescription('Here are all available moderation commands:')
            .setColor(0x0099FF)
            .setTimestamp();
        
        commands.forEach(cmd => {
            embed.addFields({
                name: cmd.name,
                value: `${cmd.description}\n*Required: ${cmd.permission}*`,
                inline: false
            });
        });
        
        embed.addFields({
            name: '📝 Permission Levels',
            value: '• **All Staff** - Nivaan Staff, Jr Moderator, Moderator, Co-owner, Owner\n• **Jr Moderator+** - Jr Moderator, Moderator, Co-owner, Owner\n• **Moderator+** - Moderator, Co-owner, Owner',
            inline: false
        });
        
        const reply = await message.reply({ embeds: [embed] });
        
        // Delete command and reply after 15 seconds (longer for reading)
        setTimeout(() => {
            message.delete().catch(() => {});
            reply.delete().catch(() => {});
        }, 15000);
    }
};
