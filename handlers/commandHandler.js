const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    console.log('📁 Loading commands...');
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('name' in command && 'execute' in command) {
            client.commands.set(command.name, command);
            console.log(`   ✅ ${command.name}`);
        } else {
            console.log(`   ❌ ${file} - Missing required properties`);
        }
    }
    
    console.log(`🔧 Loaded ${client.commands.size} commands`);
};
