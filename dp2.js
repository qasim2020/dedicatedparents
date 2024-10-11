import express from 'express';
import hbs from 'hbs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect } from 'mongoose';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import session from 'express-session';
import bodyParser from 'body-parser';

import config from './config000.json' assert { type: 'json' };

import landingPage from './modules/landingPage.js';
import events from './modules/events.js';
import team from './modules/team.js';
import causes from './modules/causes.js';
import blogs from './modules/blogs.js';
import pages from './modules/pages.js';
import contactUs from './modules/contactUs.js';
import blogPost from './modules/blogPost.js';
import page from './modules/page.js';
import causeSingle from './modules/causeSingle.js';
import teamMember from './modules/teamMember.js';
import { sendMsgToEmail } from './modules/sendMsgToEmail.js';
import subscribe from './modules/subscribe.js';
import eventSingle from './modules/eventSingle.js';
import verifyEmail from './modules/verifyEmail.js';
import postComment from './modules/postComment.js';
import createTicket from './modules/createTicket.js';


// Create an Express application
const app = express();

// Get the __filename and __dirname blogsequivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


if (process.env.NODE_ENV !== 'test') { // Only start the server if not in test environment

    var envConfig = config['development'];
    Object.keys(envConfig).forEach((key) => {
        process.env[key] = envConfig[key];
    });


    // Connect to MongoDB
    connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, })
        .then(() => { console.log('MongoDB connected'); })
        .catch((err) => { console.error('MongoDB connection error:', err); });

    mongoose.connection.once('open', () => {
        app.use(
            session({
                secret: process.env.sessionSecret,
                resave: false,
                saveUninitialized: true,
                cookie: {
                    maxAge: 20 * 60 * 1000, // 20 minutes
                },
                rolling: true,
                store: MongoStore.create({
                    mongoUrl: process.env.MONGODB_URI
                })
            })
        );
        
    });
};

app.use(express.static(join(__dirname, 'static')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
    parameterLimit: 1000000
}));

// Set up view engine
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'views'));

// Register partials
hbs.registerPartials(join(__dirname, 'views/partials'));

hbs.registerHelper('getDay', function(date) {
    let input = new Date(date);

    return input.getDate();
});

// Helpers
hbs.registerHelper('concat', function() {
    return Array.prototype.slice.call(arguments, 0, -1).join('');
});

hbs.registerHelper('getMonth', function(date) {
    let input = new Date(date);
    let months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ];
    return months[input.getMonth()];
});

hbs.registerHelper('getYear', function(date) {
    let input = new Date(date);
    return input.getFullYear();
});

hbs.registerHelper('reduceStringLength', function(string, length) {
    return string.substring(0, length);
});

hbs.registerHelper('toUpperCase', (str) => {
    return str.toUpperCase()
});

hbs.registerHelper('splitComma', (val) => {
    let output = val.split(',').map(val => val.trim() );
    return output;
});

hbs.registerHelper('reduceStringLength', function(string, length) {
    return string.substring(0, length);
});

hbs.registerHelper('inc', (val) => {
    return Number(val)+1;
});

hbs.registerHelper('getFormattedDateTimeMongoId', (objectId) => {
    if ( objectId == null ) return null;
    let date = new Date(parseInt(objectId.toString().substring(0, 8), 16) * 1000);
    let dtg = date.toString().split(" ");
    let obj = {
        time: dtg[4],
        date: dtg[2],
        month: dtg[1],
        yr: dtg[3]
    }
    let time = obj.time.split(":");
    obj.time = time[0]+time[1]+ " hrs";
    return `${obj.time} · ${obj.date} ${obj.month} ${obj.yr.slice(2,4)}`;
});

hbs.registerHelper('matchValues', (val1,val2) => {
    try {
        return val1.toString().toLowerCase()  == val2.toString().toLowerCase();
    } catch(e) {
        return false;
    }
});

// Route handling
app.get('/', async (req, res) => {
    req.params.brand = "dedicated_parents";
    const data = await landingPage(req, res);
    res.render('home', data);
});

app.get('/events', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await events(req,res);
    res.render('events', data);
});

app.get('/event/:slug', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await eventSingle(req,res);
    res.render('event', data);
});

app.get('/team', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await team(req,res);
    res.render('team', data);
});

app.get('/team-member/:slug', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await teamMember(req,res);
    console.log(data);
    res.render('team-member', data);
});

app.get('/cause/:slug', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await causeSingle(req,res);
    res.render('cause', data);
});

app.get('/causes', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await causes(req,res);
    res.render('causes', data);
});

app.get('/contact-us', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await contactUs(req,res);
    res.render('contact', data);
});

app.get('/blog/:slug', async (req,res) => { 
    req.params.brand = "dedicated_parents";
    const data = await blogPost(req,res);
    res.render('blog', data);
});

app.get('/blogs', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await blogs(req,res);
    res.render('blogs', data);
});

app.get('/pages', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await pages(req,res);
    res.render('pages', data);
});

app.get('/page/:slug', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await page(req,res);
    res.render('page', data);
});

app.post('/sendMsgToEmail', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await sendMsgToEmail(req,res);
    if (data.success) {
        res.status(200).send(data);
    } else {
        res.status(data.status).send(data.error);
    }
});

app.post('/subscribe', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await subscribe(req,res);
    if (data.success) {
        res.status(200).send("Successfully subscribed!");
    } else {
        res.status(data.status).send(data.error);
    }
});

app.get('/verifyEmail', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await verifyEmail(req,res);
    res.render('verifyEmail', data);
});

app.post('/postComment', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await postComment(req,res);
    if (data.success) {
        res.status(200).send(data);
    } else {
        res.status(data.status).send(data.error);
    }
});

app.post('/createTicket', async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await createTicket(req,res);
    if (data.success) {
        res.status(200).send(data);
    } else {
        res.status(data.status).send(data.error);
    }
});

// Error handling
app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

// Start the server
if (process.env.NODE_ENV !== 'test') { // Only start the server if not in test environment
    const PORT = 3002;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

export {app};