const express = require('express');
const passport = require('passport');
const router = express.Router();

// Login route
router.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/dashboard');
    }
    res.render('login');
});

// Discord OAuth routes
router.get('/auth/discord', passport.authenticate('discord'));

router.get('/auth/discord/callback', (req, res, next) => {
  passport.authenticate('discord', (err, user, info) => {
    if (err) {
      console.error("🔴 OAuth Error:", err);
      return res.status(500).send("OAuth Error: " + err.message);
    }

    if (!user) {
      console.warn("⚠️ No user returned from Discord. Info:", info);
      return res.redirect('/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("🔴 Login Error:", err);
        return res.status(500).send("Login Error: " + err.message);
      }

      console.log("✅ User authenticated successfully:", user.username || user.id);
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;
