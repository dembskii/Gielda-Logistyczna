const express = require('express');
const router = express.Router();
const {auth} = require('../authMiddleware')
const axios = require('axios');
const User = require('../models/User');
const Job = require('../models/Job');

router.get('/', auth ,async (req, res) => {
    try {
        // Kierowca
        if (req.user.role === 'kierowca') {
            // Wczytywanie powiadomień jeśli jakieś dostał podczas gdy był offline
            const user = await User.findById(req.user.id)
                .populate({
                    path: 'pendingInvitations',
                    populate: {
                        path: 'spedytorId',
                        select: 'name surname'
                    }
                })
                .populate('spedytorIds', 'name surname email isOnline');

            const assingedJobsResponse = await axios.get('http://localhost:3000/api/job/assigned-jobs', {
                headers: { Cookie: `auth_token=${req.cookies.auth_token}` }
                })
        
            

            res.render('driverDashboard', {
                layout: 'layouts/dashboardLayout',
                user: user,
                assignedJobs: assingedJobsResponse.data,
            });
        } else if ( req.user.role === 'spedytor') { // Spedytor

            const [allJobsResponse, acceptedJobsResponse, freeDriversResponse, managedDriversResponse ] = await Promise.all([
                axios.get('http://localhost:3000/api/job/all', {
                    headers: { Cookie: `auth_token=${req.cookies.auth_token}` }
                }),
                axios.get('http://localhost:3000/api/job/accepted-jobs', {
                    headers: { Cookie: `auth_token=${req.cookies.auth_token}` }
                }),
                axios.get('http://localhost:3000/api/job/drivers', {
                    headers: { Cookie: `auth_token=${req.cookies.auth_token}` }
                }),
                axios.get('http://localhost:3000/api/job/managed-drivers', {
                    headers: { Cookie: `auth_token=${req.cookies.auth_token}` }
                })
            ]);

            console.log(req.user);
            
            
            res.render('spedytorDashboard', {
                layout: 'layouts/dashboardLayout',
                jobs: allJobsResponse.data,
                acceptedJobs:acceptedJobsResponse.data,
                user:req.user,
                freeDrivers: freeDriversResponse.data,
                managedDrivers: managedDriversResponse.data
            });
        } else if ( req.user.role === 'zleceniodawca') { // Zleceniodawca
    
            const response = await axios.get('http://localhost:3000/api/job/own-jobs', {
                    headers: {
                        Cookie: `auth_token=${req.cookies.auth_token}`
                    }
                });
                
                res.render('clientDashboard', {
    
                    layout: 'layouts/dashboardLayout',
                    jobs: response.data,
                    user:req.user
                });
        }
    
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).send('Error loading dashboard');
    }
   
});


router.get('/invite-driver', auth, async (req, res) => {
    
    try {
        if ( req.user.role === 'spedytor') {

            const allDriversResponse = await axios.get('http://localhost:3000/api/job/drivers', {
                headers: { Cookie: `auth_token=${req.cookies.auth_token}` }
            })

            res.render('inviteDriverDashboard', {
                user: req.user,
                allDrivers: allDriversResponse.data
            })
        }
    } catch (error) {
        
    }
})

router.get('/update-job', auth, async (req, res) => {
    try {
        if (req.user.role === 'kierowca') {
            const jobId = req.query.jobId;

            job = await Job.findOne({
                _id:jobId
            })
            
            if (!job) {
                return res.status(400).json("Nie istnieje takie zlecenie")
            }
            
            res.render('driverUpdateJob', {
                layout: 'layouts/dashboardLayout',
                user: req.user,
                job: job
            });
        }
    } catch (error) {
        console.error('Error loading job update page:', error);
        res.status(500).send('Error loading job update page');
    }
});

module.exports = router;