# Lily Dashboard - Render Deployment Guide

## Prerequisites
1. A GitHub account
2. A Render account (https://render.com)
3. Your Discord bot tokens and credentials

## Step 1: Prepare Your Code for Deployment

### 1.1 Push to GitHub
1. Create a new repository on GitHub
2. Push all your bot files to the repository:
```bash
git init
git add .
git commit -m "Initial Discord bot deployment"
git remote add origin https://github.com/yourusername/discord-moderation-bot.git
git push -u origin main
```

### 1.2 Update Environment Variables
Your bot will automatically use the environment variables from Render instead of MongoDB locally.

## Step 2: Deploy to Render

### 2.1 Create a New Web Service
1. Go to https://render.com and sign in
2. Click "New +" button in the top right
3. Select "Web Service"

### 2.2 Connect Your Repository
1. Click "Connect" next to your GitHub repository
2. If you don't see it, click "Configure account" to give Render access
3. Select your `discord-moderation-bot` repository

### 2.3 Configure the Service
Fill out the deployment form:

**Basic Settings:**
- **Name**: `discord-moderation-bot` (or your preferred name)
- **Region**: Choose the closest region to you
- **Branch**: `main`
- **Root Directory**: Leave blank (unless your code is in a subfolder)

**Build and Deploy:**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`

### 2.4 Set Environment Variables
In the "Environment Variables" section, add these:

```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=https://your-app-name.onrender.com/auth/discord/callback
SESSION_SECRET=your_random_secret_key_here
NODE_ENV=production
PORT=5000
```

**Important Notes:**
- Replace `your-app-name` in REDIRECT_URI with your actual Render app name
- Generate a strong SESSION_SECRET (random string of 32+ characters)
- The bot will automatically fall back to quick.db since MongoDB isn't needed for basic functionality

### 2.5 Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your bot
3. This process takes 2-5 minutes

## Step 3: Update Discord Application Settings

### 3.1 Update OAuth2 Redirect URI
1. Go to https://discord.com/developers/applications
2. Select your application
3. Go to "OAuth2" → "General"
4. In "Redirects", add: `https://your-app-name.onrender.com/auth/discord/callback`
5. Save changes

### 3.2 Update Bot Permissions
Make sure your bot has these permissions:
- Send Messages
- Manage Messages
- Kick Members
- Ban Members
- Manage Roles
- View Channels
- Read Message History

## Step 4: Invite Bot to Your Server

Use this URL format (replace YOUR_CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1573447766&scope=bot
```

## Step 5: Access Your Dashboard

Your bot dashboard will be available at:
```
https://your-app-name.onrender.com
```

## Troubleshooting

### Common Issues:

**1. Bot Won't Start**
- Check the Render logs for error messages
- Verify all environment variables are set correctly
- Ensure DISCORD_TOKEN is valid

**2. OAuth Login Fails**
- Check REDIRECT_URI matches exactly in Discord Developer Portal
- Verify CLIENT_ID and CLIENT_SECRET are correct

**3. Commands Don't Work**
- Ensure bot has proper permissions in your Discord server
- Check the roles in `config/roles.js` match your server's role IDs

**4. Database Errors**
- The bot automatically falls back to quick.db (file-based storage)
- This is normal and functional for most use cases

### Render-Specific Notes:

**Free Tier Limitations:**
- Your service will sleep after 15 minutes of inactivity
- It takes 30-60 seconds to wake up when accessed
- Consider upgrading to a paid plan for 24/7 uptime

**Logs:**
- View real-time logs in your Render dashboard
- Use these to debug any issues

**Updates:**
- Push changes to your GitHub repository
- Render will automatically redeploy

## Optional: Database Setup (Advanced)

If you want persistent MongoDB storage:

1. Create a free MongoDB Atlas cluster
2. Get your connection string
3. Add `MONGO_URI=your_mongodb_connection_string` to environment variables
4. Redeploy the service

## Support

- Check Render logs for deployment issues
- Use Discord Developer Portal for bot/OAuth problems
- Test commands in your Discord server after deployment

Your Discord moderation bot is now live and accessible 24/7!