import express from 'express';
import hbs from 'hbs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect } from 'mongoose';
import landingPage from './modules/landingPage.js';

// Create an Express application
const app = express();

// Get the __filename and __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import config from './config000.json' assert { type: 'json' };


var envConfig = config['development'];
Object.keys(envConfig).forEach((key) => {
process.env[key] = envConfig[key];
});

// Connect to MongoDB
connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// Set up view engine
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'views'));

// Register partials
hbs.registerPartials(join(__dirname, 'views/partials'));

// Serve static files
app.use(express.static(join(__dirname, 'static')));

hbs.registerHelper('matchValues', (val1,val2) => {
    console.log(val1, val2);
    try {
        return val1.toString().toLowerCase()  == val2.toString().toLowerCase();
    } catch(e) {
        return false;
    }
});

// Route handling
app.get('/', async (req, res) => {
    try {
        req.params.brand = "dedicated_parents";
        const data = await landingPage(req, res);
        res.render('en', data);
    } catch (e) {
        console.error(e);
        res.status(e.status || 400).send(e);
    }
});

// Error handling
app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

// Start the server
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
