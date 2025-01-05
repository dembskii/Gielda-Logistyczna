const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const authMiddleware = require('../authMiddleware')



// Pobieranie wszystkich zleceń
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'active' })
            .populate('userId', 'email');
        res.json(jobs)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dodawanie zlecenia
router.post('/add', authMiddleware, async (req, res) => {
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
router.delete('/:id', authMiddleware, async (req, res) => {
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
router.post('/:id/accept', authMiddleware, async (req, res) => {
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
router.get('/own-jobs', authMiddleware, async (req, res) => {
    try {
        const jobs = await Job.find({ userId: req.user.id })
            .populate('userId', 'email')
            .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pobieranie przyjętych zleceń przez spedytora
router.get('/accepted-jobs', authMiddleware, async (req, res) => {
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


module.exports = router;

