// Importowanie bibliotek
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const https = require('https')
const fs = require('fs')
const User = require('./models/User.js')
const { Server } = require("socket.io");


// Konfiguracja SSL
const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  };


const httpsServer = https.createServer(options,app)


// Websockety
global.io = new Server(httpsServer);

// Importowanie routerów
const indexRouter = require('./routes/index.js');
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard.js')
const jobRouter = require('./routes/job.js')
const subscriptionsRouter = require('./routes/subscriptions.js')


// Łączenie z bazą danych
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


// Ustawienie EJS
app.set('view engine', 'ejs');

// Ustawienie pod authAPI
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ustawienie widoków
app.use(expressLayouts);
app.set('layout', 'layouts/dashboardLayout');
app.set('views', path.join(__dirname, 'views'));

// Podlinkowanie plików statycznych
app.use(express.static(path.join(__dirname, 'public')));
app.use('/favicon', express.static(path.join(__dirname, 'public/favicon')));

// Ciasteczka
app.use(cookieParser());


// Router
app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/job', jobRouter);
app.use('/api/subscriptions',subscriptionsRouter)
app.use('/dashboard',dashboardRouter);


// Online Offline System
global.io.on('connection', async (socket) => {
    socket.on('user_connected', async (userId) => {
        socket.join(userId);
        socket.userId = userId;
        await User.findByIdAndUpdate(userId, { isOnline: true });
        global.io.emit('status_update', { userId, isOnline: true });
    })
    socket.on('disconnect', async () => {
        const userId = socket.userId;
        if (userId) {
            await User.findByIdAndUpdate(userId, { isOnline: false });
            global.io.emit('status_update', { userId, isOnline: false });
        }
    });

});

// Uruchomienie serwera
httpsServer.listen(3000, '127.0.0.1',() => {
    console.log(`Serwer działa https://localhost:${3000}`);
});