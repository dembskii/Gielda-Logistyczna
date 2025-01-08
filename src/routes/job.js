const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const {auth} = require('../authMiddleware')
const User = require('../models/User')
const Invitation = require('../models/Invitation')



// Pobieranie wszystkich zleceń
router.get('/all', auth, async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'active' })
            .populate('userId', 'email');
        res.json(jobs)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dodawanie zlecenia
router.post('/add', auth, async (req, res) => {
    try {
        const job = new Job({
            ...req.body,
            userId: req.user.id,
            status: 'active'
        });
        await job.save();
        res.redirect('/dashboard')
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Usuwanie zlecenia
router.post('/remove-job/:id', auth, async (req, res) => {
    try {
        const job = await Job.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });

        if (!job) {
            return res.status(404).json({ error: 'Zlecenie nie znalezione' });
        }

        await job.deleteOne();
        res.json({ message: 'Zlecenie usunięte' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Przyjmowanie zlecenia
// Musi być POST zamiast PUT ponieważ html domyślnie nie wspiera PUT
router.post('/:id/accept', auth, async (req, res) => {
    try {
        const job = await Job.findOne({ 
            _id: req.params.id, 
            status: 'active' 
        });

        if (!job) {
            return res.status(404).json({ error: 'Zlecenie nie znalezione lub już zajęte' });
        }

        job.status = 'assigned';
        job.spedytorId = req.user.id;
        await job.save();

        res.redirect('/dashboard')
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Pobieranie wszystkich zlecenia danego użytkownika (zleceniodawcy)
router.get('/own-jobs', auth, async (req, res) => {
    try {
        const jobs = await Job.find({ userId: req.user.id })
            .populate('userId', 'email')
            .populate('driverId', 'name surname')
            .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pobieranie przyjętych zleceń przez spedytora
router.get('/accepted-jobs', auth, async (req, res) => {
    try {
        const jobs = await Job.find({ 
            spedytorId: req.user.id,
            status: 'assigned'
        })
        .populate('userId', 'email')
        .populate('spedytorId', 'email')
        .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Pobierz wszystkich wolnych kierowców
router.get('/drivers', auth, async (req, res) => {
    try {
        const drivers = await User.find({ 
            role: 'kierowca',
            spedytorIds: { $nin: [req.user.id]}
        });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




// Pobierz kierowców zarządzanych przez wysyłającego requesta
router.get('/managed-drivers', auth, async (req, res) => {
    try {
        if (req.user.role !== 'spedytor') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const drivers = await User.find({ 
            role: 'kierowca',
            spedytorIds: { $in: [req.user.id] } 
        });
        console.log(drivers);
        
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Zapraszanie kierowcy do bycia zarządzanym przez spedytora
router.post('/invite-driver/:driverId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'spedytor') {
            return res.status(403).json({ error: 'Tylko spedytor może wysyłać zaproszenia' });
        }
        // Szukanie czy kierowca, któremu wysyłamy zaproszenie istnieje
        // Sprawdzenie czy jest już przez nas zarządzany
        const driver = await User.findOne({ 
            _id: req.params.driverId, 
            role: 'kierowca',
            spedytorIds: { $nin: [req.user.id]}
        });

        if (!driver) {
            return res.status(404).json({ error: 'Kierowca nie znaleziony' });
        }

        // Sprawdzenie czy już go wcześniej zaprosiliśmy
        const existingInvitation = await Invitation.findOne({
            spedytorId: req.user.id,
            driverId: driver._id,
            status: 'pending'
        });

        if (existingInvitation) {
            return res.status(400).json({ error: 'Zaproszenie już istnieje' });
        }

        

        // Tworzenie nowego zaproszenia
        const invitation = new Invitation({
            spedytorId: req.user.id,
            driverId: driver._id
        });

        await invitation.save();

        // Zapełnianie zaproszenia danymi przed wysłaniem
        await invitation.populate('spedytorId', 'email');
        
        // Dodanie zaproszenia do bieżących zaproszeń - to w przypadku gdy jest offline
        await User.findByIdAndUpdate(driver._id, {
            $push: { pendingInvitations: invitation._id }
        });

        // Wysyłanie zaproszenia do kierowcy
        console.log('Emitting to:', driver._id.toString());
        
        global.io.to(driver._id.toString()).emit('new_invitation', {
            invitation: {
                _id: invitation._id,
                spedytorId: invitation.spedytorId
            },
            spedytorEmail: req.user.email
        });
        

        res.redirect('/dashboard')
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Usunięcie kierowcy
router.post('/remove-driver/:driverId', auth, async (req, res) => {

    // Znalezienie kierowcy
    const existingDriver = await User.findOne({
        _id:req.params.driverId,
        spedytorIds: { $in : [req.user.id]}
    })

    if (!existingDriver) {
        res.json({error:'Kierowca nie istnieje lub nie podlega pod spedytora, który wysłał requesta'})
    }
    
    // Zaktualizowanie prac, które miał przypisane kierowca
    await Job.updateMany(
    { driverId: existingDriver._id },
    { 
        $set: { 
            driverId: null,
        } 
    }
    );

    // Usunięcie spedytora z listy spedytorów zarządzających kierowcą.
    await User.findByIdAndUpdate(
        existingDriver._id,
        {
            $pull: { spedytorIds: req.user.id }
        },
        { new: true }
    );

    res.status(200).redirect('/dashboard')
})


// Odpowiadanie na zaproszenie spedytora
router.post('/respond-invitation/:invitationId', auth, async (req, res) => {
    try {
        const { response } = req.body;
        
        // Szukanie czy zaproszenie istnieje
        const invitation = await Invitation.findOne({
            _id: req.params.invitationId,
            driverId: req.user.id,
            status: 'pending'
        }).populate('spedytorId');

        if (!invitation) {
            return res.status(404).json({ error: 'Zaproszenie nie znalezione' });
        }

        // Sprawdzenie co kierowca zadecydował
        invitation.status = response === 'accept' ? 'accepted' : 'rejected';
        await invitation.save();

        // Jeśli zaakceptował to dodajemy mu do spedytorIds spedytora, który mu wysłał zaproszenie
        if (response === 'accept') {
            await User.findByIdAndUpdate(req.user.id, {
                $pull: { pendingInvitations: invitation._id },
                $addToSet: { spedytorIds: invitation.spedytorId._id }
            });
        
            
            // Emitowanie zaproszenia do spedytora - to w przypadku gdy jest online
            global.io.to(invitation.spedytorId._id.toString()).emit('driver_accepted', {
                driverId: req.user.id,
                driverEmail: req.user.email
            });

        }

        return res.redirect('/dashboard');
    } catch (error) {
        console.error('Error processing invitation:', error);
        return res.status(500).json({ error: error.message });
    }
});


router.post('/assign-driver/:driverId/:jobId', auth ,async (req, res) => {

    // Przypisanie kierowcy do zlecenia
    await Job.findOneAndUpdate({
        _id:req.params.jobId,
        spedytorId : req.user.id,
    },
    {
        $set: {
            driverId: req.params.driverId
            }
        }
    )

    res.json(''),200
})

module.exports = router;

