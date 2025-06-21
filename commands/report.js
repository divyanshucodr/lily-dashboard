const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');
const Guild = require('../models/Guild');

module.exports = {
    name: 'report',
    description: 'Report a user for misconduct',
    usage: '!report @user reason location evidence',
    requiredPermission: 1,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'report')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user mentioned
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Please mention a user to report.');
        }
        
        // Parse arguments
        const argsList = args.slice(1);
        if (argsList.length < 3) {
            return message.reply('❌ Please provide: reason, location, and evidence.\nExample: `!report @user harassment #general screenshot.png`');
        }
        
        const reason = argsList[0];
        const location = argsList[1];
        const evidence = argsList.slice(2).join(' ');
        
        try {
            // Get guild settings for reports channel
            const guildData = await Guild.findOne({ guildId: message.guild.id });
            let reportsChannel = null;
            
            // Try to find reports channel
            if (guildData && guildData.reportsChannel) {
                reportsChannel = message.guild.channels.cache.get(guildData.reportsChannel);
            }
            
            // Fallback to common channel names
            if (!reportsChannel) {
                reportsChannel = message.guild.channels.cache.find(c => 
                    c.name.includes('reports') || 
                    c.name.includes('mod-logs') || 
                    c.name.includes('moderation')
                );
            }
            
            // If still no channel found, use the current channel
            if (!reportsChannel) {
                reportsChannel = message.channel;
            }
            
            // Generate unique report ID
            const reportId = Date.now().toString(36).toUpperCase();
            
            // Create report embed
            const reportEmbed = new EmbedBuilder()
                .setTitle('🚨 User Report')
                .setColor(0xFF0000)
                .addFields(
                    { name: 'Report ID', value: reportId, inline: true },
                    { name: 'Reported User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Reporter', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Location', value: location, inline: true },
                    { name: 'Evidence', value: evidence, inline: true },
                    { name: 'Status', value: '🔍 Pending Review', inline: true }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Reported in ${message.channel.name}` });
            
            // Create action buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`report_review_${reportId}`)
                        .setLabel('Mark Reviewed')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId(`report_assign_${reportId}`)
                        .setLabel('Assign Moderator')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('👮'),
                    new ButtonBuilder()
                        .setCustomId(`report_action_${reportId}`)
                        .setLabel('Take Action')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⚡')
                );
            
            // Send report to reports channel
            const reportMessage = await reportsChannel.send({
                embeds: [reportEmbed],
                components: [actionRow]
            });
            
            // Create thread for the report if possible
            if (reportsChannel.type === 0) { // Text channel
                try {
                    await reportMessage.startThread({
                        name: `Report-${reportId}-${user.username}`,
                        autoArchiveDuration: 1440 // 24 hours
                    });
                } catch (error) {
                    console.log('Could not create thread for report:', error.message);
                }
            }
            
            // Delete the original report command
            await message.delete();
            
            // Send confirmation to reporter via DM
            try {
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('✅ Report Submitted')
                    .setColor(0x00FF00)
                    .addFields(
                        { name: 'Report ID', value: reportId, inline: true },
                        { name: 'Server', value: message.guild.name, inline: true },
                        { name: 'Reported User', value: user.tag, inline: true },
                        { name: 'Status', value: 'Your report has been submitted and will be reviewed by the moderation team.', inline: false }
                    )
                    .setTimestamp();
                
                await message.author.send({ embeds: [confirmEmbed] });
            } catch (error) {
                // If DM fails, send a temporary message in the channel
                const tempMsg = await message.channel.send(`✅ ${message.author}, your report (ID: ${reportId}) has been submitted successfully.`);
                setTimeout(() => tempMsg.delete().catch(() => {}), 5000);
            }
            
            // Log the report action
            await logAction(message.guild, 'report', {
                reporter: message.author,
                reportedUser: user,
                reason: reason,
                location: location,
                evidence: evidence,
                reportId: reportId,
                channel: reportsChannel
            });
            
        } catch (error) {
            console.error('Error creating report:', error);
            message.reply('❌ An error occurred while creating the report.').then(msg => {
                setTimeout(() => {
                    message.delete().catch(() => {});
                    msg.delete().catch(() => {});
                }, 5000);
            });
        }
    }
};
