const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
        console.log(`🏰 Serving ${client.guilds.cache.size} servers`);
        console.log(`👥 Watching ${client.users.cache.size} users`);
        
        // Set bot activity
        client.user.setActivity('for rule breakers', { type: ActivityType.Watching });
        
        // Check for expired mutes every minute
        setInterval(async () => {
            try {
                const Mute = require('../models/Mute');
                const expiredMutes = await Mute.find({
                    expiresAt: { $lte: new Date() },
                    active: true
                });
                
                for (const mute of expiredMutes) {
                    try {
                        const guild = client.guilds.cache.get(mute.guildId);
                        if (!guild) continue;
                        
                        const member = guild.members.cache.get(mute.userId);
                        if (!member) continue;
                        
                        const Guild = require('../models/Guild');
                        const guildData = await Guild.findOne({ guildId: guild.id });
                        if (!guildData || !guildData.muteRole) continue;
                        
                        const muteRole = guild.roles.cache.get(guildData.muteRole);
                        if (!muteRole) continue;
                        
                        await member.roles.remove(muteRole);
                        mute.active = false;
                        await mute.save();
                        
                        console.log(`🔓 Auto-unmuted ${member.user.tag} in ${guild.name}`);
                    } catch (error) {
                        console.error('Error auto-unmuting user:', error);
                    }
                }
            } catch (error) {
                console.error('Error checking expired mutes:', error);
            }
        }, 60000); // Check every minute
    }
};
