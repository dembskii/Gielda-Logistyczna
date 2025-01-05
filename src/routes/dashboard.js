const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware')
const axios = require('axios');

router.get('/', authMiddleware ,async (req, res) => {
    if ( req.user.role === 'kierowca' ) {
        res.render('driverDashboard', {
            layout: 'layouts/dashboardLayout'
        });
    } else if ( req.user.role === 'spedytor') {
        res.render('spedytorDashboard', {
            layout: 'layouts/dashboardLayout'
        });
    } else if ( req.user.role === 'zleceniodawca') {

        const response = await axios.get('http://localhost:3000/api/job/own-jobs', {
                headers: {
                    Cookie: `auth_token=${req.cookies.auth_token}`
                }
            });
            
            res.render('clientDashboard', {
                layout: 'layouts/dashboardLayout',
                jobs: response.data
            });
    }
   
});

module.exports = router;