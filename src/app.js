const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index.js');
const app = express();

// Ustawienie EJS
app.set('view engine', 'ejs');

// Ustawienie widoków
app.set('views', path.join(__dirname, 'views'));

// Podlinkowanie plików statycznych
app.use(express.static(path.join(__dirname, 'public')));

// Router
app.use('/', indexRouter);

// Uruchomienie serwera
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serwer działa http://localhost:${PORT}`);
});