const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    
    res.render('signup',{
        layout: false
    });
});

module.exports = router;