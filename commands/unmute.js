const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');
const Mute = require('../models/Mute');
const Guild = require('../models/Guild');

module.exports = {
    name: 'unmute',
    description: 'Unmute a user',
    usage: '!unmute @user',
    requiredPermission: 3,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'unmute')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user mentioned
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Please mention a user to unmute.');
        }
        
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ User not found in this server.');
        }
        
        try {
            // Get mute role
            const guildData = await Guild.findOne({ guildId: message.guild.id });
            if (!guildData || !guildData.muteRole) {
                return message.reply('❌ No mute role found. The user may not be muted.');
            }
            
            const muteRole = message.guild.roles.cache.get(guildData.muteRole);
            if (!muteRole) {
                return message.reply('❌ Mute role not found. The user may not be muted.');
            }
            
            // Check if user has mute role
            if (!member.roles.cache.has(muteRole.id)) {
                return message.reply('❌ This user is not muted.');
            }
            
            // Remove mute role
            await member.roles.remove(muteRole);
            
            // Update database
            await Mute.findOneAndUpdate(
                { guildId: message.guild.id, userId: user.id, active: true },
                { active: false }
            );
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('✅ User Unmuted')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true }
                )
                .setTimestamp();
            
            const reply = await message.reply({ embeds: [embed] });
            
            // Log action
            await logAction(message.guild, 'unmute', {
                user: user,
                moderator: message.author
            });
            
            // Delete command and reply after 5 seconds
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error unmuting user:', error);
            message.reply('❌ An error occurred while trying to unmute the user.');
        }
    }
};
