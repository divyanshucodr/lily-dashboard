const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');

module.exports = {
    name: 'serverinfo',
    description: 'Get information about the server',
    usage: '!serverinfo',
    requiredPermission: 1,
    
    async execute(message, args) {
        // Check permissions
        if (!checkPermissions(message.member, 'serverinfo')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        
        const guild = message.guild;
        
        // Get member counts
        const members = await guild.members.fetch();
        const humans = members.filter(member => !member.user.bot).size;
        const bots = members.filter(member => member.user.bot).size;
        
        // Get channel counts
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;
        
        // Get verification level
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };
        
        // Get boost info
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount;
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('🏰 Server Information')
            .setColor(0x0099FF)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Members', value: `👥 ${guild.memberCount}\n👤 ${humans} Humans\n🤖 ${bots} Bots`, inline: true },
                { name: 'Channels', value: `💬 ${textChannels} Text\n🔊 ${voiceChannels} Voice\n📁 ${categories} Categories`, inline: true },
                { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
                { name: 'Verification Level', value: verificationLevels[guild.verificationLevel], inline: true },
                { name: 'Boost Level', value: `Level ${boostLevel} (${boostCount} boosts)`, inline: true },
                { name: 'Created', value: `<t:${Math.floor(guild.createdAt.getTime() / 1000)}:F>`, inline: true }
            )
            .setTimestamp();
        
        // Add server icon
        if (guild.iconURL()) {
            embed.setThumbnail(guild.iconURL({ dynamic: true, size: 256 }));
        }
        
        // Add banner if available
        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ dynamic: true, size: 512 }));
        }
        
        const reply = await message.reply({ embeds: [embed] });
        
        // Delete command and reply after 10 seconds
        setTimeout(() => {
            message.delete().catch(() => {});
            reply.delete().catch(() => {});
        }, 10000);
    }
};
