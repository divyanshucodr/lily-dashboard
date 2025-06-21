const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');

async function logAction(guild, action, data) {
    try {
        // Get guild settings
        const guildData = await Guild.findOne({ guildId: guild.id });
        
        // Find mod log channel
        let modLogChannel = null;
        if (guildData && guildData.modLogChannel) {
            modLogChannel = guild.channels.cache.get(guildData.modLogChannel);
        }
        
        // Fallback to common channel names
        if (!modLogChannel) {
            modLogChannel = guild.channels.cache.find(c => 
                c.name.includes('mod-log') || 
                c.name.includes('modlog') || 
                c.name.includes('audit') ||
                c.name.includes('logs')
            );
        }
        
        if (!modLogChannel) return; // No log channel found
        
        // Create log embed based on action type
        const embed = createLogEmbed(action, data);
        
        await modLogChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging action:', error);
    }
}

function createLogEmbed(action, data) {
    const embed = new EmbedBuilder()
        .setTimestamp()
        .setFooter({ text: `Action: ${action}` });
    
    switch (action) {
        case 'kick':
            embed
                .setTitle('🦵 User Kicked')
                .setColor(0xFFA500)
                .addFields(
                    { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                    { name: 'Moderator', value: data.moderator.tag, inline: true },
                    { name: 'Reason', value: data.reason, inline: false }
                );
            break;
            
        case 'ban':
            embed
                .setTitle('🔨 User Banned')
                .setColor(0xFF0000)
                .addFields(
                    { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                    { name: 'Moderator', value: data.moderator.tag, inline: true },
                    { name: 'Reason', value: data.reason, inline: false }
                );
            break;
            
        case 'unban':
            embed
                .setTitle('✅ User Unbanned')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                    { name: 'Moderator', value: data.moderator.tag, inline: true }
                );
            break;
            
        case 'mute':
            embed
                .setTitle('🔇 User Muted')
                .setColor(0xFF8C00)
                .addFields(
                    { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                    { name: 'Duration', value: data.duration, inline: true },
                    { name: 'Moderator', value: data.moderator.tag, inline: true },
                    { name: 'Reason', value: data.reason, inline: false },
                    { name: 'Expires', value: `<t:${Math.floor(data.expiresAt.getTime() / 1000)}:R>`, inline: false }
                );
            break;
            
        case 'unmute':
            embed
                .setTitle('🔊 User Unmuted')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                    { name: 'Moderator', value: data.moderator.tag, inline: true }
                );
            break;
            
        case 'warn':
            embed
                .setTitle('⚠️ User Warned')
                .setColor(0xFFFF00)
                .addFields(
                    { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                    { name: 'Warning #', value: data.warningNumber.toString(), inline: true },
                    { name: 'Moderator', value: data.moderator.tag, inline: true },
                    { name: 'Reason', value: data.reason, inline: false }
                );
            break;
            
        case 'unwarn':
            embed
                .setTitle('❌ Warning Removed')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                    { name: 'Warning #', value: data.warningNumber.toString(), inline: true },
                    { name: 'Moderator', value: data.moderator.tag, inline: true },
                    { name: 'Original Reason', value: data.originalReason, inline: false }
                );
            break;
            
        case 'clearwarnings':
            embed
                .setTitle('🧹 Warnings Cleared')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                    { name: 'Warnings Cleared', value: data.warningsCleared.toString(), inline: true },
                    { name: 'Moderator', value: data.moderator.tag, inline: true }
                );
            break;
            
        case 'purge':
            embed
                .setTitle('🧹 Messages Purged')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'Channel', value: data.channel.toString(), inline: true },
                    { name: 'Messages Deleted', value: data.messagesDeleted.toString(), inline: true },
                    { name: 'Moderator', value: data.moderator.tag, inline: true }
                );
            break;
            
        case 'report':
            embed
                .setTitle('🚨 User Reported')
                .setColor(0xFF0000)
                .addFields(
                    { name: 'Report ID', value: data.reportId, inline: true },
                    { name: 'Reporter', value: data.reporter.tag, inline: true },
                    { name: 'Reported User', value: `${data.reportedUser.tag} (${data.reportedUser.id})`, inline: true },
                    { name: 'Reason', value: data.reason, inline: false },
                    { name: 'Location', value: data.location, inline: true },
                    { name: 'Evidence', value: data.evidence, inline: true },
                    { name: 'Report Channel', value: data.channel.toString(), inline: true }
                );
            break;
            
        default:
            embed
                .setTitle('📝 Moderation Action')
                .setColor(0x0099FF)
                .setDescription(`Unknown action: ${action}`);
    }
    
    return embed;
}

module.exports = {
    logAction
};
