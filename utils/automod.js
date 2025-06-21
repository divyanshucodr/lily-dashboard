const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const Warning = require('../models/Warning');
const { logAction } = require('./logger');

// Store recent messages for spam detection
const recentMessages = new Map();
const userSpamCount = new Map();

async function checkAutoMod(message) {
    try {
        // Get guild automod settings
        const guildData = await Guild.findOne({ guildId: message.guild.id });
        if (!guildData || !guildData.autoMod.enabled) return;
        
        // Anti-spam check
        if (guildData.autoMod.antiSpam) {
            if (await checkSpam(message)) return; // Message was deleted
        }
        
        // Anti-link check
        if (guildData.autoMod.antiLink) {
            if (await checkSuspiciousLinks(message)) return; // Message was deleted
        }
        
        // Bad words filter
        if (guildData.autoMod.badWords) {
            if (await checkBadWords(message, guildData.autoMod.badWordsList)) return; // Message was deleted
        }
        
    } catch (error) {
        console.error('Error in auto-moderation:', error);
    }
}

async function checkSpam(message) {
    const userId = message.author.id;
    const currentTime = Date.now();
    
    // Initialize user data if not exists
    if (!recentMessages.has(userId)) {
        recentMessages.set(userId, []);
    }
    
    if (!userSpamCount.has(userId)) {
        userSpamCount.set(userId, 0);
    }
    
    // Get user's recent messages
    const userMessages = recentMessages.get(userId);
    
    // Remove messages older than 5 seconds
    const recentUserMessages = userMessages.filter(msgTime => currentTime - msgTime < 5000);
    
    // Add current message
    recentUserMessages.push(currentTime);
    recentMessages.set(userId, recentUserMessages);
    
    // Check for spam (more than 5 messages in 5 seconds)
    if (recentUserMessages.length > 5) {
        try {
            // Delete the message
            await message.delete();
            
            // Increment spam count
            const spamCount = userSpamCount.get(userId) + 1;
            userSpamCount.set(userId, spamCount);
            
            // Create warning embed
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Auto-Moderation: Spam Detected')
                .setColor(0xFF8C00)
                .addFields(
                    { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Channel', value: message.channel.toString(), inline: true },
                    { name: 'Action', value: 'Message deleted', inline: true }
                )
                .setTimestamp();
            
            // Send warning to channel
            const warningMsg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
            
            // Auto-warn after 3 spam violations
            if (spamCount >= 3) {
                await autoWarn(message, 'Repeated spam violations (Auto-Moderation)');
                userSpamCount.set(userId, 0); // Reset count after warning
            }
            
            // Log action
            await logAction(message.guild, 'automod_spam', {
                user: message.author,
                channel: message.channel,
                content: message.content.substring(0, 100)
            });
            
            return true; // Message was deleted
        } catch (error) {
            console.error('Error handling spam:', error);
        }
    }
    
    return false;
}

async function checkSuspiciousLinks(message) {
    // Common suspicious link patterns
    const suspiciousPatterns = [
        /discord\.gg\/(?![\w-]+$)/i, // Invalid Discord invites
        /discordapp\.com\/(?!api|channels)/i, // Fake Discord links
        /steamcommunity\.com\.[\w]+/i, // Fake Steam links
        /bit\.ly|tinyurl|t\.co/i, // Shortened URLs (often used maliciously)
        /free-nitro|nitro-free|discord-nitro/i, // Nitro scams
        /@everyone|@here/i // Mass mentions in links context
    ];
    
    const content = message.content.toLowerCase();
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
            try {
                // Delete the message
                await message.delete();
                
                // Create warning embed
                const embed = new EmbedBuilder()
                    .setTitle('🔗 Auto-Moderation: Suspicious Link Detected')
                    .setColor(0xFF4500)
                    .addFields(
                        { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                        { name: 'Channel', value: message.channel.toString(), inline: true },
                        { name: 'Action', value: 'Message deleted & user warned', inline: true },
                        { name: 'Content', value: message.content.substring(0, 100) + '...', inline: false }
                    )
                    .setTimestamp();
                
                // Send warning to channel
                const warningMsg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => warningMsg.delete().catch(() => {}), 8000);
                
                // Auto-warn user
                await autoWarn(message, 'Posting suspicious/malicious links (Auto-Moderation)');
                
                // Log action
                await logAction(message.guild, 'automod_link', {
                    user: message.author,
                    channel: message.channel,
                    content: message.content.substring(0, 200)
                });
                
                return true; // Message was deleted
            } catch (error) {
                console.error('Error handling suspicious link:', error);
            }
        }
    }
    
    return false;
}

async function checkBadWords(message, badWordsList) {
    const content = message.content.toLowerCase();
    
    // Check for bad words
    const foundBadWords = badWordsList.filter(word => 
        content.includes(word.toLowerCase())
    );
    
    if (foundBadWords.length > 0) {
        try {
            // Delete the message
            await message.delete();
            
            // Create warning embed
            const embed = new EmbedBuilder()
                .setTitle('🤬 Auto-Moderation: Inappropriate Language')
                .setColor(0xFF0000)
                .addFields(
                    { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Channel', value: message.channel.toString(), inline: true },
                    { name: 'Action', value: 'Message deleted & user warned', inline: true }
                )
                .setTimestamp();
            
            // Send warning to channel
            const warningMsg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
            
            // Auto-warn user
            await autoWarn(message, 'Using inappropriate language (Auto-Moderation)');
            
            // Log action
            await logAction(message.guild, 'automod_badwords', {
                user: message.author,
                channel: message.channel,
                badWords: foundBadWords
            });
            
            return true; // Message was deleted
        } catch (error) {
            console.error('Error handling bad words:', error);
        }
    }
    
    return false;
}

async function autoWarn(message, reason) {
    try {
        // Get warning count for auto-incrementing warning ID
        const warningCount = await Warning.countDocuments({
            guildId: message.guild.id,
            userId: message.author.id
        });
        
        // Create warning record
        const warning = new Warning({
            guildId: message.guild.id,
            userId: message.author.id,
            moderatorId: message.client.user.id, // Bot as moderator
            reason: reason,
            warningId: warningCount + 1
        });
        await warning.save();
        
        // Send DM to user
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('⚠️ You have been warned')
                .setColor(0xFFFF00)
                .addFields(
                    { name: 'Server', value: message.guild.name, inline: true },
                    { name: 'Warning #', value: `${warningCount + 1}`, inline: true },
                    { name: 'Moderator', value: 'Auto-Moderation System', inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            await message.author.send({ embeds: [dmEmbed] });
        } catch (error) {
            // DM failed, send message in channel
            const failMsg = await message.channel.send(`❗ ${message.author}, couldn't DM you about your warning.`);
            setTimeout(() => failMsg.delete().catch(() => {}), 5000);
        }
        
        // Log the warning
        await logAction(message.guild, 'warn', {
            user: message.author,
            moderator: { tag: 'Auto-Moderation System' },
            reason: reason,
            warningNumber: warningCount + 1
        });
        
    } catch (error) {
        console.error('Error creating auto-warning:', error);
    }
}

// Clean up old data every hour
setInterval(() => {
    const currentTime = Date.now();
    for (const [userId, messages] of recentMessages.entries()) {
        const recentUserMessages = messages.filter(msgTime => currentTime - msgTime < 300000); // 5 minutes
        if (recentUserMessages.length === 0) {
            recentMessages.delete(userId);
        } else {
            recentMessages.set(userId, recentUserMessages);
        }
    }
    
    // Reset spam counts every hour
    userSpamCount.clear();
}, 3600000);

module.exports = {
    checkAutoMod
};
