const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const hbs = require('hbs');
const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/dedicatedparents', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Set up view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Register partials
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Route handling
app.get('/', (req, res) => {
    console.log("opening home");
    res.render('home', { title: 'Home Page' });
});

// Error handling
app.use((req, res) => {
    res.status(404).send('404 Not Found');
});


const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

