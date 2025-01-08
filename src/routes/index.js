const express = require('express');
const router = express.Router();
const {isTokenValid} = require('../authMiddleware');

router.get('/', async (req, res) => {
    const isLoggedIn = await isTokenValid(req) ? true : false

    res.render('index',{
        layout: false,
        isLoggedIn:isLoggedIn

    });
});


router.get('/auth', (req, res) => {
    res.render('auth', {
        layout: false
    });
});



module.exports = router;