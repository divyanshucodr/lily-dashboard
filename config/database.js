const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/discord-bot';
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        
        // Fallback to quick.db if MongoDB fails
        console.log('🔄 Falling back to quick.db...');
        const db = require('quick.db');
        global.fallbackDB = db;
    }
};

module.exports = connectDB;
