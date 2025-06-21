const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    prefix: {
        type: String,
        default: '!'
    },
    modLogChannel: {
        type: String,
        default: null
    },
    reportsChannel: {
        type: String,
        default: null
    },
    autoMod: {
        enabled: {
            type: Boolean,
            default: false
        },
        antiSpam: {
            type: Boolean,
            default: false
        },
        antiLink: {
            type: Boolean,
            default: false
        },
        badWords: {
            type: Boolean,
            default: false
        },
        badWordsList: {
            type: [String],
            default: ['fuck', 'shit', 'damn', 'bitch', 'ass', 'nigga', 'nigger', 'retard']
        }
    },
    commands: {
        type: Map,
        of: Boolean,
        default: new Map()
    },
    muteRole: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Guild', guildSchema);
