function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function ensureGuildPermissions(req, res, next) {
    const guildId = req.params.guildId;
    
    // Check if user has access to this guild
    const guild = req.user.guilds.find(g => g.id === guildId);
    
    if (!guild) {
        return res.status(403).send('You do not have access to this guild');
    }
    
    // Check if user has MANAGE_GUILD permission
    const hasPermission = (guild.permissions & 0x20) === 0x20 || // MANAGE_GUILD
                         (guild.permissions & 0x8) === 0x8;      // ADMINISTRATOR
    
    if (!hasPermission) {
        return res.status(403).send('You do not have permission to manage this guild');
    }
    
    next();
}

module.exports = {
    ensureAuthenticated,
    ensureGuildPermissions
};
