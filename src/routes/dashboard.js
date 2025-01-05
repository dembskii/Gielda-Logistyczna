const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware')


router.get('/', authMiddleware ,(req, res) => {
    if ( req.user.role === 'kierowca' ) {
        res.render('driverDashboard', {
            layout: 'layouts/dashboardLayout'
        });
    } else if ( req.user.role === 'spedytor') {
        res.render('spedytorDashboard', {
            layout: 'layouts/dashboardLayout'
        });
    } else if ( req.user.role === 'zleceniodawca') {
        res.render('clientDashboad', {
            layout: 'layouts/dashboardLayout'
        });
    }
   
});

module.exports = router;