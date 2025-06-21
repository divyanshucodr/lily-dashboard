const express = require('express');
const router = express.Router();
const Guild = require('../../models/Guild');
const Warning = require('../../models/Warning');
const Mute = require('../../models/Mute');
const { ensureAuthenticated, ensureGuildPermissions } = require('../middleware/auth');

// Dashboard home - show user's guilds
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        let managedGuilds = [];
        
        if (req.user.guilds && Array.isArray(req.user.guilds)) {
            // Filter guilds where user has MANAGE_GUILD permission
            managedGuilds = req.user.guilds.filter(guild => 
                (guild.permissions & 0x20) === 0x20 || // MANAGE_GUILD
                (guild.permissions & 0x8) === 0x8      // ADMINISTRATOR
            );
        }
        
        res.render('dashboard', { 
            user: req.user, 
            guilds: managedGuilds 
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('dashboard', { 
            user: req.user, 
            guilds: [],
            error: 'Unable to load server list. Please try refreshing the page.'
        });
    }
});

// Guild management page
router.get('/guild/:guildId', ensureAuthenticated, ensureGuildPermissions, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        
        // Get bot client
        const client = require('../../index');
        const guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return res.status(404).send('Guild not found or bot not in guild');
        }
        
        // Get guild settings from database
        let guildData = await Guild.findOne({ guildId });
        if (!guildData) {
            guildData = new Guild({ guildId });
            await guildData.save();
        }
        
        // Get statistics
        const stats = {
            totalWarnings: await Warning.countDocuments({ guildId, active: true }),
            activeMutes: await Mute.countDocuments({ guildId, active: true }),
            totalMembers: guild.memberCount
        };
        
        // Get recent warnings
        const recentWarnings = await Warning.find({ guildId, active: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'username')
            .exec();
        
        res.render('guild', {
            user: req.user,
            guild: guild,
            guildData: guildData,
            stats: stats,
            recentWarnings: recentWarnings
        });
        
    } catch (error) {
        console.error('Guild page error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
