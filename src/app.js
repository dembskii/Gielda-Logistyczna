// Importowanie bibliotek
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');


// Importowanie routerów
const indexRouter = require('./routes/index.js');
const signinRouter = require('./routes/signin.js')
const signupRouter = require('./routes/signup.js')
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard.js')
const jobRouter = require('./routes/job.js')


// Łączenie z bazą danych
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


const app = express();

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

// Ciasteczka
app.use(cookieParser());

// Router
app.use('/', indexRouter);
app.use('/signin', signinRouter);
app.use('/signup', signupRouter);
app.use('/api/auth', authRouter);
app.use('/api/job', jobRouter);
app.use('/dashboard',dashboardRouter);


// Uruchomienie serwera
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serwer działa http://localhost:${PORT}`);
});