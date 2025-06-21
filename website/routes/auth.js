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

router.get('/auth/discord/callback', 
    passport.authenticate('discord', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

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
