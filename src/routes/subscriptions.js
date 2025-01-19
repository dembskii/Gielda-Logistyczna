const express = require('express');
const router = express.Router();
const {auth} = require('../services/authService')
const User = require('../models/User')


router.post('/sub/:path', auth, async (req, res) => {

    try {
        const path = req.params.path;
    
        const result = await User.updateOne(
            { _id: req.user.id },
            { $addToSet: { subscribedUrls: path } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json('Account not found');
        }

        if (result.modifiedCount === 0) {
            return res.status(201).json('Already subscribed');
        }

        return res.status(200).json('Updated successfully');
    } catch (error) {
        res.status(500).json('Server error')
    }
})

router.delete('/unsub/:path', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json('Account not found');
        }

        const path = req.params.path;
        const index = user.subscribedUrls.indexOf(path);
        if (index > -1) {
            user.subscribedUrls.splice(index, 1);
            console.log('unsubscribed');
            
            await user.save();
        }

        res.status(200).json('Unsubscribed successfully');
    } catch (error) {
        res.status(500).json('Server error');
    }
});




module.exports = router;
