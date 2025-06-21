const { Collection } = require('discord.js');
const { checkAutoMod } = require('../utils/automod');

// Cooldown collection for commands
const cooldowns = new Collection();

module.exports = {
    name: 'messageCreate',
    execute(message) {
        // Ignore bot messages and DMs
        if (message.author.bot || !message.guild) return;
        
        // Check auto-moderation first
        checkAutoMod(message);
        
        // Get prefix from database or use default
        const prefix = '!'; // TODO: Get from database
        
        // Check if message starts with prefix
        if (!message.content.startsWith(prefix)) return;
        
        // Parse command and arguments
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Get command
        const command = message.client.commands.get(commandName) || 
                       message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) return;
        
        // Command cooldown handling
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Collection());
        }
        
        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`⏰ Please wait ${timeLeft.toFixed(1)} more seconds before using the \`${command.name}\` command again.`)
                    .then(msg => {
                        setTimeout(() => {
                            message.delete().catch(() => {});
                            msg.delete().catch(() => {});
                        }, 3000);
                    });
            }
        }
        
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        // Execute command
        try {
            command.execute(message, args);
        } catch (error) {
            console.error('Error executing command:', error);
            message.reply('❌ There was an error executing that command.').then(msg => {
                setTimeout(() => {
                    message.delete().catch(() => {});
                    msg.delete().catch(() => {});
                }, 5000);
            });
        }
    }
};
