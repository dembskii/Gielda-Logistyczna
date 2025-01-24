const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const {auth} = require('../services/authService')
const User = require('../models/User')
const Invitation = require('../models/Invitation')
const mqttClient = require('../services/mqttService')



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
        mqttClient.publish('new-jobs',JSON.stringify({message:'Someone published new job!'}))
        res.redirect('/dashboard')
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Usuwanie zlecenia
router.delete('/remove-job/:id', auth, async (req, res) => {
    try {
        const job = await Job.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });

        if (!job) {
            return res.status(404).json({ error: 'Zlecenie nie znalezione' });
        }
        // Sprawdzanie czy jest conajmniej 12H przed odbiorem (jeśli jest już przyjęte)
        const currentTime = new Date();
        const pickupTime = new Date(job.pickup.date);
        const hoursBeforePickup = (pickupTime - currentTime) / (1000 * 60 * 60);

        if (hoursBeforePickup < 12 && job.status !== 'active') {
            return res.status(400).json({
                error: "Nie można już usunąć zlecenia, zostało mniej niż 12h a zlecenie jest już przyjęta"
            })
        }

        // Usuwanie referncji odnośnie zasubskrybowanych scieżek MQTT 
        await User.updateMany(
            { subscribedUrls: job._id },
            { $pull: { subscribedUrls: job._id } }
        );


        await job.deleteOne();
        res.status(200).json({ message: 'Zlecenie usunięte' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Przyjmowanie zlecenia przez spedytora
router.patch('/:id/accept', auth, async (req, res) => {
    ;
    
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
        mqttClient.publish(`${job._id}`,JSON.stringify({status:job.status}))
        await job.save();
        mqttClient.publish(`/sync-job-status/${job.id}`,JSON.stringify({new_status:job.status}))

        res.status(200).json('Job accepted')
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rezygnacja ze zlecenia przez spedytora
router.delete('/:id/delete', auth, async (req, res) => {
    try {
        const job = await Job.findOne({ 
            _id: req.params.id, 
            spedytorId: req.user.id,
            status: 'assigned'
        });

        if (!job) {
            return res.status(404).json({ error: 'Zlecenie jest już w trakcie wykonywania' });
        }

        const timeUntilStart = job.startDate - new Date();
        if (timeUntilStart < 12 * 60 * 60 * 1000) { 
            return res.status(400).json({ error: 'Nie można zrezygnować ze zlecenia na mniej niż 12h przed rozpoczęciem' });
        }
        if (job.driverId) {
            global.io.to(job.driverId.toString()).emit('removed_job',{
                job:job,
                spedytorName: req.user.name,
                spedytorSurname: req.user.surname
            })
        }
        
        job.status = 'active';
        job.spedytorId = null;
        job.driverId = null;
        await job.save();
        mqttClient.publish(`/sync-job-status/${job.id}`,JSON.stringify({new_status:job.status}))

        mqttClient.publish(`${job._id}`,JSON.stringify({status:job.status}))


        res.status(200).json('Zrezygnowano ze zlecenia');
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
        })
        .populate('userId', 'email')
        .populate('spedytorId', 'email')
        .populate('driverId', 'name surname')
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
        await invitation.populate('spedytorId', 'name surname email');
        
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
            spedytorEmail: req.user.email,
            spedytorName: req.user.name,
            spedytorSurname: req.user.surname

        });
        

        res.redirect('/dashboard')
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Usunięcie kierowcy
router.delete('/remove-driver/:driverId', auth, async (req, res) => {

    // Znalezienie kierowcy
    const existingDriver = await User.findOne({
        _id:req.params.driverId,
        spedytorIds: { $in : [req.user.id]}
    })

    if (!existingDriver) {
        res.status(404).json({error:'Kierowca nie istnieje lub nie podlega pod spedytora, który wysłał requesta'})
    }

    // Szukanie prac, które są już rozpoczęte, lub których nie można już anulować
    const upcomingJobs = await Job.find({
        driverId: existingDriver._id,
        status: {
            $in: [
                'assigned',
                'heading_to_pickup',
                'waiting_for_pickup',
                'picked_up',
                'in_transit',
                'at_delivery'
            ]
        }
    });

    if (upcomingJobs.length > 0) {
        // Check for active jobs (any status except 'assigned')
        const activeJobs = upcomingJobs.filter(job => job.status !== 'assigned');
        if (activeJobs.length > 0) {
            return res.status(400).json({
                error: 'Nie można usunąć kierowcy, który ma aktywne zlecenia'
            });
        }

        // Check for upcoming jobs within 12 hours
        const jobsStartingSoon = upcomingJobs.filter(job => 
            job.status === 'assigned' && 
            job.pickup.date < new Date(Date.now() + (12 * 60 * 60 * 1000))
        );
        
        if (jobsStartingSoon.length > 0) {
            return res.status(400).json({
                error: 'Nie można usunąć kierowcy, który ma zlecenia rozpoczynające się w ciągu najbliższych 12 godzin'
            });
        }
    }
    
    // Zaktualizowanie prac, które miał przypisane kierowca,
    await Job.updateMany(
        { 
            driverId: existingDriver._id,
        },
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

    

    global.io.to(existingDriver.id.toString()).emit('removed-by-spedytor', {
        spedytorId: req.user.id,
        spedytorEmail: req.user.email,
        spedytorName: req.user.name,
        spedytorSurname: req.user.surname
    });

    res.status(200).json('Sucessfully removed driver')
})


// Odpowiadanie na zaproszenie spedytora
router.patch('/respond-invitation/:invitationId', auth, async (req, res) => {
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
                driverEmail: req.user.email,
                driverName: req.user.name,
                driverSurname: req.user.surname
            });

        } else {
            // Skasowanie zaproszenia
            await User.findByIdAndUpdate(req.user.id, {
                $pull: { pendingInvitations: invitation._id }
            });

            global.io.to(invitation.spedytorId._id.toString()).emit('driver_rejected', {
                driverId: req.user.id,
                driverEmail: req.user.email,
                driverName: req.user.name,
                driverSurname: req.user.surname
            });
        }

        return res.status(200).json('Received invitation successfully')
    } catch (error) {
        console.error('Error processing invitation:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Przypisanie kierowcy do zlecenia
router.patch('/assign-driver/:driverId/:jobId', auth ,async (req, res) => {

    // Przypisanie kierowcy do zlecenia
    const job = await Job.findOneAndUpdate(
        {
            _id: req.params.jobId,
            spedytorId: req.user.id,
        },
        {
            $set: {
                driverId: req.params.driverId
            }
        },
        {new: true}
    )

    global.io.to(req.params.driverId).emit('new_job', {
        job: job,
        spedytorName: req.user.name,
        spedytorSurname: req.user.surname
    });
    mqttClient.publish(`/sync-job-status/${job.id}`,JSON.stringify({new_status:job.status}))
    res.status(200).json('Driver assigned successfully')
})

// Pobiera przypisane do kierowcy zlecenia
router.get('/assigned-jobs', auth, async (req, res) => {
    
    if (req.user.role === 'kierowca') {
        const assignedJobs = await Job.find({
            driverId: req.user.id
        })
        
        

        res.status(200).json(assignedJobs)

        
    } 
})


// Aktualizowanie statusu przez kierowce
router.patch('/update-job-status', auth, async (req, res) => {
    try {
        
        if (req.user.role !== 'kierowca') {
            return res.status(403).json({ message: 'Tylko kierowca może aktualizować status zlecenia' });
        }

        const { jobId, status, message } = req.body;

        
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Nie znaleziono zlecenia' });
        }

        // Sprawdzanie czy kierowca jest przypisany do zlecenia
        if (job.driverId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Nie jesteś przypisany do tego zlecenia' });
        }

        // Ustalenie jakie statusy może ustawić w zależności od aktualnego
        const validTransitions = {
            'assigned': ['heading_to_pickup', 'cancelled'],
            'heading_to_pickup': ['waiting_for_pickup', 'cancelled'],
            'waiting_for_pickup': ['picked_up', 'cancelled'],
            'picked_up': ['in_transit', 'cancelled'],
            'in_transit': ['in_transit','at_delivery', 'cancelled'], // In transit jest po to, że jakby chciał message samo wysłać
            'at_delivery': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': []
        };

        // Sprawdzenie czy się zgadza z założeniami
        if (!validTransitions[job.status].includes(status)) {
            return res.status(400).json({ 
                message: 'Nieprawidłowa zmiana statusu',
                currentStatus: job.status,
                allowedTransitions: validTransitions[job.status]
            });
        }

        // Akutalizacja
        job.status = status;
        await job.save();
        mqttClient.publish(`${jobId}`,JSON.stringify({status}))
        mqttClient.publish(`/sync-job-status/${job.id}`,JSON.stringify({new_status:job.status}))
        
        res.status(200).json('Job status updated successfully')

    } catch (error) {
        console.error('Job status update error:', error);
        res.status(500).json({ message: 'Błąd podczas aktualizacji statusu zlecenia' });
    }
});

module.exports = router;

