const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

// Step 1: Redirect user to Discord for login
router.get("/discord", (req, res) => {
  const authorizeUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
  res.redirect(authorizeUrl);
});

// Step 2: Callback route after login
router.get("/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code provided");

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI,
      scope: "identify guilds"
    }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const access_token = tokenResponse.data.access_token;

    // Fetch user's Discord profile
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const user = userResponse.data;
    console.log("Logged in user:", user);

    // ✅ Redirect or respond here
    res.send(`Welcome ${user.username}#${user.discriminator}`);
    // OR: res.redirect("/dashboard"); if you have one
  } catch (error) {
    console.error("OAuth error:", error.response?.data || error.message);
    res.status(500).send("Something broke during login.");
  }
});

module.exports = router;
