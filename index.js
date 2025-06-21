const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Initialize collections
client.commands = new Collection();
client.events = new Collection();

// Database connection
const connectDB = require('./config/database');
connectDB();

// Load handlers
require('./handlers/commandHandler')(client);
require('./handlers/eventHandler')(client);

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch(console.error);

// Start web server
if (process.env.NODE_ENV !== 'bot-only') {
    require('./website/server');
}

module.exports = client;
