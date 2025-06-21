const { EmbedBuilder } = require('discord.js');

async function sendDM(user, embedData) {
    try {
        const embed = new EmbedBuilder()
            .setTitle(embedData.title)
            .setColor(embedData.color)
            .setTimestamp();
        
        if (embedData.description) {
            embed.setDescription(embedData.description);
        }
        
        if (embedData.fields) {
            embed.addFields(embedData.fields);
        }
        
        await user.send({ embeds: [embed] });
        return true;
    } catch (error) {
        console.log(`Could not send DM to ${user.tag}:`, error.message);
        return false;
    }
}

module.exports = {
    sendDM
};
