const express = require('express');
const router = express.Router();
const Guild = require('../../models/Guild');
const Warning = require('../../models/Warning');
const Mute = require('../../models/Mute');
const { ensureAuthenticated, ensureGuildPermissions } = require('../middleware/auth');

// Update guild settings
router.post('/guild/:guildId/settings', ensureAuthenticated, ensureGuildPermissions, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const { prefix, modLogChannel, reportsChannel, autoMod } = req.body;
        
        await Guild.findOneAndUpdate(
            { guildId },
            {
                prefix: prefix || '!',
                modLogChannel: modLogChannel || null,
                reportsChannel: reportsChannel || null,
                autoMod: {
                    enabled: autoMod?.enabled === 'on',
                    antiSpam: autoMod?.antiSpam === 'on',
                    antiLink: autoMod?.antiLink === 'on',
                    badWords: autoMod?.badWords === 'on'
                }
            },
            { upsert: true }
        );
        
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Toggle command
router.post('/guild/:guildId/command/:commandName/toggle', ensureAuthenticated, ensureGuildPermissions, async (req, res) => {
    try {
        const { guildId, commandName } = req.params;
        const { enabled } = req.body;
        
        await Guild.findOneAndUpdate(
            { guildId },
            { [`commands.${commandName}`]: enabled },
            { upsert: true }
        );
        
        res.json({ success: true, message: `Command ${commandName} ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error('Command toggle error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get warnings for user
router.get('/guild/:guildId/warnings/:userId', ensureAuthenticated, ensureGuildPermissions, async (req, res) => {
    try {
        const { guildId, userId } = req.params;
        
        const warnings = await Warning.find({ guildId, userId, active: true })
            .sort({ createdAt: -1 })
            .exec();
        
        res.json({ success: true, warnings });
    } catch (error) {
        console.error('Get warnings error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Remove warning
router.delete('/guild/:guildId/warning/:warningId', ensureAuthenticated, ensureGuildPermissions, async (req, res) => {
    try {
        const { guildId, warningId } = req.params;
        
        await Warning.findOneAndUpdate(
            { guildId, _id: warningId },
            { active: false }
        );
        
        res.json({ success: true, message: 'Warning removed successfully' });
    } catch (error) {
        console.error('Remove warning error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Mute user from web
router.post('/guild/:guildId/mute', ensureAuthenticated, ensureGuildPermissions, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const { userId, duration, reason } = req.body;
        
        // Get bot client and guild
        const client = require('../../index');
        const guild = client.guilds.cache.get(guildId);
        const member = guild.members.cache.get(userId);
        
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }
        
        // Parse duration to milliseconds
        const durationMs = parseDuration(duration);
        if (!durationMs) {
            return res.status(400).json({ success: false, message: 'Invalid duration format' });
        }
        
        // Get or create mute role
        let guildData = await Guild.findOne({ guildId });
        if (!guildData || !guildData.muteRole) {
            return res.status(400).json({ success: false, message: 'Mute role not configured' });
        }
        
        const muteRole = guild.roles.cache.get(guildData.muteRole);
        if (!muteRole) {
            return res.status(400).json({ success: false, message: 'Mute role not found' });
        }
        
        // Add mute role
        await member.roles.add(muteRole);
        
        // Save mute to database
        const expiresAt = new Date(Date.now() + durationMs);
        const muteRecord = new Mute({
            guildId,
            userId,
            moderatorId: req.user.id,
            reason: reason || 'No reason provided (Web Dashboard)',
            expiresAt
        });
        await muteRecord.save();
        
        res.json({ success: true, message: 'User muted successfully' });
    } catch (error) {
        console.error('Web mute error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Unmute user from web
router.post('/guild/:guildId/unmute', ensureAuthenticated, ensureGuildPermissions, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const { userId } = req.body;
        
        // Get bot client and guild
        const client = require('../../index');
        const guild = client.guilds.cache.get(guildId);
        const member = guild.members.cache.get(userId);
        
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }
        
        // Get mute role
        const guildData = await Guild.findOne({ guildId });
        if (!guildData || !guildData.muteRole) {
            return res.status(400).json({ success: false, message: 'Mute role not configured' });
        }
        
        const muteRole = guild.roles.cache.get(guildData.muteRole);
        if (!muteRole) {
            return res.status(400).json({ success: false, message: 'Mute role not found' });
        }
        
        // Remove mute role
        await member.roles.remove(muteRole);
        
        // Update database
        await Mute.findOneAndUpdate(
            { guildId, userId, active: true },
            { active: false }
        );
        
        res.json({ success: true, message: 'User unmuted successfully' });
    } catch (error) {
        console.error('Web unmute error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

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

module.exports = router;
