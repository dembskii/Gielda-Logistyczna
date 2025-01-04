const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');


// Rejestracja
router.post('/register', async (req, res) => {
    
    try {
        const user = new User(req.body);
        await user.save();
        res.redirect('/signin')
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Logowanie
router.post('/login', async (req, res) => {
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
    
        console.log('Zalogowano pomyślnie');
        res.redirect('/')
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


module.exports = router;