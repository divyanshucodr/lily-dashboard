const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const Warning = require('../models/Warning');

module.exports = {
    name: 'warnings',
    description: 'View warnings for a user',
    usage: '!warnings @user',
    requiredPermission: 1,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'warnings')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user mentioned
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Please mention a user to view warnings for.');
        }
        
        try {
            // Get all active warnings
            const warnings = await Warning.find({
                guildId: message.guild.id,
                userId: user.id,
                active: true
            }).sort({ createdAt: 1 });
            
            if (warnings.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 User Warnings')
                    .setDescription(`${user.tag} has no active warnings.`)
                    .setColor(0x00FF00)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Create warning list
            const warningList = warnings.map((warning, index) => {
                const moderator = message.guild.members.cache.get(warning.moderatorId);
                const moderatorTag = moderator ? moderator.user.tag : 'Unknown Moderator';
                const date = warning.createdAt.toLocaleDateString();
                
                return `**${warning.warningId}.** ${warning.reason}\n*By: ${moderatorTag} | Date: ${date}*`;
            }).join('\n\n');
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('📋 User Warnings')
                .setDescription(`**User:** ${user.tag}\n**Total Warnings:** ${warnings.length}\n\n${warningList}`)
                .setColor(0xFFFF00)
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();
            
            const reply = await message.reply({ embeds: [embed] });
            
            // Delete command and reply after 10 seconds (longer for reading)
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 10000);
            
        } catch (error) {
            console.error('Error fetching warnings:', error);
            message.reply('❌ An error occurred while fetching warnings.');
        }
    }
};
