const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { logAction } = require('../utils/logger');
const { sendDM } = require('../utils/dm');
const Mute = require('../models/Mute');
const Guild = require('../models/Guild');

module.exports = {
    name: 'mute',
    description: 'Mute a user for a specified duration',
    usage: '!mute @user [duration] [reason]',
    requiredPermission: 3,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'mute')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        // Check if user mentioned
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Please mention a user to mute.');
        }
        
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ User not found in this server.');
        }
        
        // Check if user is trying to mute themselves
        if (user.id === message.author.id) {
            return message.reply('❌ You cannot mute yourself.');
        }
        
        // Parse duration and reason
        const duration = args[1] || '10m';
        const reason = args.slice(2).join(' ') || 'No reason provided';
        
        // Parse duration to milliseconds
        const durationMs = parseDuration(duration);
        if (!durationMs) {
            return message.reply('❌ Invalid duration format. Use: 1m, 1h, 1d, etc.');
        }
        
        try {
            // Get or create mute role
            let muteRole = await getMuteRole(message.guild);
            
            // Add mute role to user
            await member.roles.add(muteRole);
            
            // Calculate expiry date
            const expiresAt = new Date(Date.now() + durationMs);
            
            // Save mute to database
            const muteRecord = new Mute({
                guildId: message.guild.id,
                userId: user.id,
                moderatorId: message.author.id,
                reason: reason,
                expiresAt: expiresAt
            });
            await muteRecord.save();
            
            // Send DM to user
            await sendDM(user, {
                title: '🔇 You have been muted',
                fields: [
                    { name: 'Server', value: message.guild.name, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: false }
                ],
                color: 0xFF8C00
            });
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('✅ User Muted')
                .setColor(0xFF8C00)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: false }
                )
                .setTimestamp();
            
            const reply = await message.reply({ embeds: [embed] });
            
            // Log action
            await logAction(message.guild, 'mute', {
                user: user,
                moderator: message.author,
                reason: reason,
                duration: duration,
                expiresAt: expiresAt
            });
            
            // Set timeout for auto-unmute
            setTimeout(async () => {
                try {
                    await member.roles.remove(muteRole);
                    await Mute.findOneAndUpdate(
                        { guildId: message.guild.id, userId: user.id, active: true },
                        { active: false }
                    );
                } catch (error) {
                    console.error('Error auto-unmuting user:', error);
                }
            }, durationMs);
            
            // Delete command and reply after 5 seconds
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error muting user:', error);
            message.reply('❌ An error occurred while trying to mute the user.');
        }
    }
};

function parseDuration(duration) {
    const regex = /^(\d+)([smhd])$/;
    const match = duration.match(regex);
    
    if (!match) return null;
    
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000
    };
    
    return amount * multipliers[unit];
}

async function getMuteRole(guild) {
    // Check if mute role exists in database
    const guildData = await Guild.findOne({ guildId: guild.id });
    
    if (guildData && guildData.muteRole) {
        const role = guild.roles.cache.get(guildData.muteRole);
        if (role) return role;
    }
    
    // Create new mute role
    const muteRole = await guild.roles.create({
        name: 'Muted',
        color: '#808080',
        permissions: [],
        reason: 'Auto-created mute role'
    });
    
    // Update all channels to deny permissions for mute role
    guild.channels.cache.forEach(async channel => {
        try {
            await channel.permissionOverwrites.create(muteRole, {
                SendMessages: false,
                AddReactions: false,
                Speak: false,
                Connect: false
            });
        } catch (error) {
            console.error(`Error updating permissions for channel ${channel.name}:`, error);
        }
    });
    
    // Save mute role to database
    await Guild.findOneAndUpdate(
        { guildId: guild.id },
        { muteRole: muteRole.id },
        { upsert: true }
    );
    
    return muteRole;
}
