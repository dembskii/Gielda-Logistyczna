const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {auth} = require('../authMiddleware')



// Rejestracja
router.post('/register', async (req, res) => {
    
    try {
        const user = new User(req.body);
        await user.save();
        const token = jwt.sign(
            { 
                id: user._id,
                email: user.email,
                role: user.role 
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.redirect('/signin')
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Logowanie
router.post('/login',async (req, res) => {
    try {

        const { email, password } = req.body;
        // Szukanie użytkownika przez emial
        const user = await User.findOne({ email });

        if (!user) {
            console.log("Nie znaleziono użytkownika");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Niepoprawne hasło');
        }
        const token = jwt.sign(
            { 
                id: user._id,
                email: user.email,
                role: user.role 
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log('Zalogowano pomyślnie');

        res.cookie('auth_token', token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        res.redirect('/dashboard')
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Wylogowywanie
router.post('/logout', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { isOnline: false });
        res.clearCookie('auth_token');
        res.redirect('/');
    } catch (error) {
        res.status(500).json({ error: 'Błąd podczas wylogowywania' });
    }
});


module.exports = router;