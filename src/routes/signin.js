const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('signin',{
        layout: false
    });
});

module.exports = router;