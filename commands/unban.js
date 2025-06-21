const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');

module.exports = {
    name: 'unban',
    description: 'Unban a user from the server',
    usage: '!unban [userID]',
    requiredPermission: 4,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'unban')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user ID provided
        const userId = args[0];
        if (!userId) {
            return message.reply('❌ Please provide a user ID to unban.');
        }
        
        try {
            // Check if user is banned
            const bannedUsers = await message.guild.bans.fetch();
            const bannedUser = bannedUsers.get(userId);
            
            if (!bannedUser) {
                return message.reply('❌ This user is not banned.');
            }
            
            // Unban the user
            await message.guild.members.unban(userId);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('✅ User Unbanned')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'User', value: `${bannedUser.user.tag} (${bannedUser.user.id})`, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true }
                )
                .setTimestamp();
            
            const reply = await message.reply({ embeds: [embed] });
            
            // Log action
            await logAction(message.guild, 'unban', {
                user: bannedUser.user,
                moderator: message.author
            });
            
            // Delete command and reply after 5 seconds
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error unbanning user:', error);
            message.reply('❌ An error occurred while trying to unban the user.');
        }
    }
};
