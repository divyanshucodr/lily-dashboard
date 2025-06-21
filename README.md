# Lily Dashboard 🛡️

A comprehensive Discord moderation bot with a professional web dashboard, built with discord.js v14 and Express.js.

**Made by Your_Name | Co-owner: Ash**

## Features

### 🔧 Moderation Commands
- `!kick @user [reason]` - Kick a user from the server
- `!ban @user [reason]` - Ban a user from the server  
- `!unban [userID]` - Unban a user by ID
- `!mute @user [duration] [reason]` - Mute a user (supports: 1m, 1h, 1d)
- `!unmute @user` - Unmute a user
- `!warn @user [reason]` - Warn a user
- `!unwarn @user [warning#]` - Remove a specific warning
- `!clearwarnings @user` - Clear all warnings for a user
- `!warnings @user` - View user warnings
- `!purge [amount]` - Delete messages (1-100)
- `!userinfo @user` - Get user information
- `!serverinfo` - Get server information
- `!modcommands` - List all commands

### 🚨 Report System
- `!report @user reason location evidence` - Report users with evidence
- Interactive buttons for moderators (Mark Reviewed, Assign, Take Action)
- Automatic thread creation for each report
- Comprehensive logging system

### 🤖 Auto-Moderation
- **Anti-Spam**: Detects rapid message sending
- **Anti-Link**: Blocks suspicious/malicious links
- **Bad Words Filter**: Customizable word filtering
- **Auto-Warning**: Automatic warnings for violations
- **Configurable**: Enable/disable features via dashboard

### 🌐 Web Dashboard
- **Discord OAuth2 Login**: Secure authentication
- **Guild Management**: Manage multiple servers
- **Real-time Settings**: Configure prefix, channels, auto-mod
- **Warning Management**: View and remove warnings
- **Command Toggle**: Enable/disable commands
- **Quick Actions**: Mute/unmute from web interface
- **Responsive Design**: Mobile-friendly interface

### 👮 Role-Based Permissions
- **Owner**: Full access to all commands
- **Co-owner**: Full access to all commands  
- **Moderator**: Access to all commands
- **Jr Moderator**: All except kick, ban, unban
- **Nivaan Staff**: Only warn command

## Installation

### Prerequisites
- Node.js 16.0.0 or higher
- Discord Bot Token
- Discord Application (Client ID & Secret)

### Local Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure:
   ```env
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   REDIRECT_URI=http://localhost:5000/auth/discord/callback
   SESSION_SECRET=your_random_secret
   ```
4. Start the bot:
   ```bash
   npm start
   ```

### Discord Setup
1. Create application at https://discord.com/developers/applications
2. Create a bot user and copy the token
3. Set OAuth2 redirect URI in Discord Developer Portal
4. Invite bot with proper permissions

## Deployment

### Render Deployment (Recommended)
See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for detailed steps.

**Quick Steps:**
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### Environment Variables for Production
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id  
CLIENT_SECRET=your_client_secret
REDIRECT_URI=https://your-app.onrender.com/auth/discord/callback
SESSION_SECRET=your_random_secret
NODE_ENV=production
PORT=5000
```

## Project Structure

```
├── commands/           # Bot commands
├── config/            # Configuration files
├── events/            # Discord event handlers  
├── handlers/          # Command and event loaders
├── models/            # Database models
├── utils/             # Utility functions
├── website/           # Web dashboard
│   ├── routes/        # Express routes
│   ├── views/         # EJS templates
│   ├── public/        # Static files
│   └── middleware/    # Authentication middleware
├── index.js           # Main bot file
└── README.md
```

## Database

- **Primary**: MongoDB (with Mongoose)
- **Fallback**: quick.db (SQLite-based)
- Automatic fallback ensures the bot works without external database

## Security Features

- Secure session management
- Discord OAuth2 authentication
- Permission-based command access
- Rate limiting and cooldowns
- Input validation and sanitization

## Commands Overview

| Command | Permission Level | Description |
|---------|-----------------|-------------|
| kick, ban, unban | Moderator+ | Server moderation |
| mute, unmute, purge | Jr Moderator+ | Message/user management |
| warn, warnings | All Staff | Warning system |
| unwarn, clearwarnings | Jr Moderator+ | Warning management |
| userinfo, serverinfo | All Staff | Information commands |
| report | All Staff | Report system |

## Auto-Features

- **Auto-Delete**: Command messages auto-delete after 5 seconds
- **Auto-Unmute**: Automatic unmuting when duration expires
- **Auto-DM**: Users receive DMs for moderation actions
- **Auto-Log**: All actions logged to designated channels

## Support

- Check logs for troubleshooting
- Ensure proper bot permissions in Discord
- Verify role IDs in `config/roles.js`
- Test commands after deployment

## License

MIT License - Feel free to modify and use for your servers.

---

**Built with discord.js v14 | Express.js | MongoDB | Bootstrap 5**