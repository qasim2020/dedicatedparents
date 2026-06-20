import express from 'express';
import hbs from 'hbs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { connect } from 'mongoose';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import session from 'express-session';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import Members from './models/members.js';
import Webinars from './models/webinars.js';
import GiftPromotions from './models/giftPromotions.js';
import { sendMemberEmail, renderMemberActionEmail } from './services/memberMailerService.js';
import {
    normalizeEmail,
    hashPassword,
    verifyPassword,
    createToken,
    hashToken,
    tokenExpiry,
    isStrongPassword,
} from './services/memberAuthService.js';
import { listPublishedWebinars } from './services/webinarService.js';
import { createSignedDownloadUrl } from './services/attachmentStorageService.js';

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

import sendErrorToTelegram from './modules/bot.js';

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


if (process.env.NODE_ENV !== 'test') {
    connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, })
        .then(() => { console.log('MongoDB connected'); })
        .catch((err) => { console.error('MongoDB connection error:', err); });
}

const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'dedicated-parents-session',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 20 * 60 * 1000,
    },
    rolling: true,
};

if (process.env.NODE_ENV !== 'test' && process.env.MONGO_URI) {
    sessionConfig.store = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
    });
}

app.use(session(sessionConfig));

app.use(express.static(join(__dirname, 'static')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
    parameterLimit: 1000000
}));

app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'views'));

hbs.registerPartials(join(__dirname, 'views/partials'));

hbs.registerHelper('getDay', function(date) {
    let input = new Date(date);

    return input.getDate();
});

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
    return String(str || '').toUpperCase()
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

hbs.registerHelper('cloudinaryTransformation', (url, height, width) => {
    if (!url || typeof url !== 'string') {
        return '';
    }
    if (!url.includes('/upload/')) {
        return url;
    }
    const transformation = `w_${width},h_${height},c_lpad`;
    return url.replace('/upload/', `/upload/${transformation}/`);
})

hbs.registerHelper('eq', (a, b) => a === b);

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const timestamp = new Date().toISOString();
    const country = req.headers['cf-ipcountry'] || 'Unknown';
    console.log(`${timestamp} | ${ip} | ${country} | ${req.originalUrl} `);
    let oldSend = res.send;
    let oldJson = res.json;

    let responseBody;

    res.send = function (data) {
        responseBody = data;
        return oldSend.apply(res, arguments);
    };

    res.json = function (data) {
        responseBody = data;
        return oldJson.apply(res, arguments);
    };

    const forbiddenErrors = ['/overlay/fonts/Karla-regular.woff', '/robots.txt'];

    res.on('finish', () => {
        if (res.statusCode > 399 && !forbiddenErrors.includes(req.originalUrl)) {
            const errorData = {
                message: responseBody,
                status: res.statusCode,
                url: req.originalUrl,
            };
            sendErrorToTelegram(errorData);
        }
    });

    next();
});

app.use((req, res, next) => {
    res.locals.member = req.session?.member || null;
    next();
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function getBaseWebsiteUrl(req) {
    const configuredUrl = process.env.MEMBER_URL
        || process.env.member_url
        || process.env.DEDICATED_PARENTS_URL
        || process.env.DOMAIN_URL;
    if (configuredUrl) return configuredUrl.replace(/\/$/, '');
    return `${req.protocol}://${req.get('host')}`;
}

function setMemberSession(req, res, member, redirect = '/members/webinars') {
    req.session.member = {
        id: member._id.toString(),
        email: member.email,
        name: member.name,
        status: member.status,
    };

    req.session.save(() => {
        res.json({ success: true, redirect });
    });
}

function requireMemberAuth(req, res, next) {
    const member = req.session?.member;
    if (!member?.id) {
        return res.redirect('/members/login');
    }
    if (member.status === 'disabled') {
        req.session.destroy(() => res.redirect('/members/login?disabled=1'));
        return;
    }
    next();
}

function memberPageDefaults() {
    return {
        footerBlogs: [],
        meta: {
            img: 'https://res.cloudinary.com/miscellaneous/image/upload/v1728680792/dedicatedparents/meta-image.png',
        },
    };
}

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

const handleVerifyEmail = async (req,res) => {
    req.params.brand = "dedicated_parents";
    const data = await verifyEmail(req,res);
    res.render('verifyEmail', data);
};

app.get('/verifyEmail', handleVerifyEmail);
app.get('/verifyEmail/n', handleVerifyEmail);

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

app.get('/members/login', async (req, res) => {
    const common = memberPageDefaults();
    res.render('members-login', {
        ...common,
        active: 'members',
        message: req.query.disabled ? 'Your account is disabled. Please contact support.' : '',
    });
});

app.post('/members/login', async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');
        if (!isValidEmail(email) || !password) {
            return res.status(400).json({ error: 'Valid email and password are required.' });
        }

        const member = await Members.findOne({ email });
        if (!member || !member.passwordSalt || !member.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (member.status === 'disabled') {
            return res.status(403).json({ error: 'This account is disabled.' });
        }

        if (!member.emailVerified) {
            return res.status(403).json({ error: 'Please verify your email first.' });
        }

        const ok = await verifyPassword(password, member.passwordSalt, member.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        setMemberSession(req, res, member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/members/signup', async (req, res) => {
    const common = memberPageDefaults();
    const inviteToken = String(req.query.token || '').trim();
    let inviteMember = null;
    let inviteError = '';

    if (inviteToken) {
        inviteMember = await Members.findOne({
            verificationToken: hashToken(inviteToken),
            verificationTokenExpiresAt: { $gt: new Date() },
            status: 'invited',
        });

        if (!inviteMember) {
            inviteError = 'This invite link is invalid or has expired.';
        } else if (inviteMember.status === 'disabled') {
            inviteMember = null;
            inviteError = 'This invite is disabled. Please contact support.';
        }
    }

    res.render('members-signup', {
        ...common,
        active: 'members',
        inviteMode: Boolean(inviteMember),
        inviteToken: inviteToken || '',
        invitedEmail: inviteMember?.email || '',
        inviteName: inviteMember?.name || '',
        inviteError,
    });
});

app.post('/members/signup', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');
        const inviteToken = String(req.body.inviteToken || '').trim();

        if (inviteToken) {
            if (!name || !isStrongPassword(password)) {
                return res.status(400).json({
                    error: 'Name and a strong password are required.',
                });
            }

            const invitedMember = await Members.findOne({
                verificationToken: hashToken(inviteToken),
                verificationTokenExpiresAt: { $gt: new Date() },
                status: 'invited',
            });

            if (!invitedMember) {
                return res.status(400).json({ error: 'Invite link is invalid or expired.' });
            }

            if (invitedMember.status === 'disabled') {
                return res.status(403).json({ error: 'This account is disabled.' });
            }

            const { salt, hash } = await hashPassword(password);
            invitedMember.name = name;
            invitedMember.passwordSalt = salt;
            invitedMember.passwordHash = hash;
            invitedMember.status = 'active';
            invitedMember.emailVerified = true;
            invitedMember.verificationToken = null;
            invitedMember.verificationTokenExpiresAt = null;
            await invitedMember.save();

            return setMemberSession(req, res, invitedMember);
        }

        if (!name || !isValidEmail(email) || !isStrongPassword(password)) {
            return res.status(400).json({
                error: 'Name, valid email, and strong password are required.',
            });
        }

        const existing = await Members.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }

        const verificationTokenRaw = createToken(32);
        const { salt, hash } = await hashPassword(password);

        await Members.create({
            name,
            email,
            passwordSalt: salt,
            passwordHash: hash,
            status: 'pending',
            emailVerified: false,
            verificationToken: hashToken(verificationTokenRaw),
            verificationTokenExpiresAt: tokenExpiry(48),
        });

        const verifyUrl = `${getBaseWebsiteUrl(req)}/members/verify-email?token=${encodeURIComponent(verificationTokenRaw)}`;
        try {
            await sendMemberEmail({
                to: email,
                subject: 'Verify your Dedicated Parents member account',
                html: await renderMemberActionEmail({
                    name,
                    portalLabel: 'Dedicated Parents Members',
                    heading: 'Verify Your Account',
                    introLine: `Welcome to <strong>Dedicated Parents</strong> members-only webinars.`,
                    bodyLine: 'Use the button below to verify your email and activate your account.',
                    buttonUrl: verifyUrl,
                    buttonText: 'Verify My Account',
                    hint: 'This verification link expires in 48 hours for your security.',
                }),
            });
        } catch (mailError) {
            return res.status(201).json({
                success: true,
                warning: 'Account created, but verification email could not be sent.',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Account created. Please verify your email.',
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get('/members/verify-email', async (req, res) => {
    try {
        const token = String(req.query.token || '');
        let message = 'Verification link is invalid or expired.';
        let success = false;

        if (token) {
            const member = await Members.findOne({
                verificationToken: hashToken(token),
                verificationTokenExpiresAt: { $gt: new Date() },
            });

            if (member) {
                member.emailVerified = true;
                member.status = 'active';
                member.verificationToken = null;
                member.verificationTokenExpiresAt = null;
                await member.save();
                success = true;
                message = 'Email verified. You can now log in.';
            }
        }

        const common = memberPageDefaults();
        return res.render('members-verify-email', {
            ...common,
            active: 'members',
            success,
            message,
        });
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

app.get('/members/forgot-password', async (req, res) => {
    const common = memberPageDefaults();
    res.render('members-forgot-password', {
        ...common,
        active: 'members',
    });
});

app.post('/members/forgot-password', async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Please provide a valid email.' });
        }

        const member = await Members.findOne({ email });
        if (!member) {
            return res.json({ success: true });
        }

        const token = createToken(32);
        member.resetToken = hashToken(token);
        member.resetTokenExpiresAt = tokenExpiry(1);
        await member.save();

        const resetUrl = `${getBaseWebsiteUrl(req)}/members/reset-password?token=${encodeURIComponent(token)}`;
        await sendMemberEmail({
            to: member.email,
            subject: 'Reset your Dedicated Parents member password',
            html: await renderMemberActionEmail({
                name: member.name,
                portalLabel: 'Dedicated Parents Members',
                heading: 'Reset Your Password',
                introLine: 'We received a request to reset your member password.',
                bodyLine: 'Use the button below to choose a new password and sign back in.',
                buttonUrl: resetUrl,
                buttonText: 'Reset Password',
                hint: 'This reset link expires in 1 hour for your security.',
            }),
        });

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get('/members/reset-password', async (req, res) => {
    const common = memberPageDefaults();
    res.render('members-reset-password', {
        ...common,
        active: 'members',
        token: String(req.query.token || ''),
    });
});

app.post('/members/reset-password', async (req, res) => {
    try {
        const token = String(req.body.token || '');
        const password = String(req.body.password || '');

        if (!token || !isStrongPassword(password)) {
            return res.status(400).json({ error: 'Invalid token or weak password.' });
        }

        const member = await Members.findOne({
            resetToken: hashToken(token),
            resetTokenExpiresAt: { $gt: new Date() },
        });

        if (!member) {
            return res.status(400).json({ error: 'Reset link is invalid or expired.' });
        }
        if (member.status === 'disabled') {
            return res.status(403).json({ error: 'This account is disabled.' });
        }

        const { salt, hash } = await hashPassword(password);
        member.passwordSalt = salt;
        member.passwordHash = hash;
        member.status = 'active';
        member.emailVerified = true;
        member.resetToken = null;
        member.resetTokenExpiresAt = null;
        await member.save();

        return setMemberSession(req, res, member);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get('/members/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/members/login'));
});

app.get('/members/webinars', requireMemberAuth, async (req, res) => {
    const common = memberPageDefaults();
    const webinars = await listPublishedWebinars(Webinars);
    res.render('members-webinars', {
        ...common,
        active: 'members',
        webinars,
    });
});

app.get('/members/attachments', requireMemberAuth, async (req, res) => {
    const common = memberPageDefaults();
    const webinars = await listPublishedWebinars(Webinars);
    const attachments = webinars
        .flatMap((webinar) =>
            (webinar.attachments || []).map((attachment) => ({
                ...attachment,
                webinarId: webinar._id,
                webinarTitle: webinar.title,
                webinarSlug: webinar.slug,
            }))
        )
        .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));

    res.render('members-attachments', {
        ...common,
        active: 'members',
        attachments,
    });
});

app.get('/members/gifts-promotions', requireMemberAuth, async (req, res) => {
    const common = memberPageDefaults();
    const giftPromotions = await GiftPromotions.find({
        isActive: true,
    }).sort({ sortOrder: -1, createdAt: -1 }).lean();

    res.render('members-gifts-promotions', {
        ...common,
        active: 'members',
        giftPromotions,
    });
});

app.get('/members/webinars/:slug', requireMemberAuth, async (req, res) => {
    const common = memberPageDefaults();
    const webinarQuery = Webinars.findOne({
        slug: req.params.slug,
        published: true,
        publishedAt: { $lte: new Date() },
    });
    const webinar = await (typeof webinarQuery?.lean === 'function' ? webinarQuery.lean() : webinarQuery);

    if (!webinar) {
        return res.status(404).send('Webinar not found');
    }

    webinar.embedUrl = webinar.streamPlaybackId ? `https://iframe.videodelivery.net/${webinar.streamPlaybackId}` : '';
    webinar.attachments = (webinar.attachments || []).sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));

    return res.render('members-webinar-detail', {
        ...common,
        active: 'members',
        webinar,
    });
});

app.post('/members/webinars/:id/attachments/:attachmentId/signed-download', requireMemberAuth, async (req, res) => {
    try {
        const webinarQuery = Webinars.findOne({
            _id: req.params.id,
            published: true,
            publishedAt: { $lte: new Date() },
        });
        const webinar = await (typeof webinarQuery?.lean === 'function' ? webinarQuery.lean() : webinarQuery);

        if (!webinar) {
            return res.status(404).json({ error: 'Webinar not found' });
        }

        const attachment = (webinar.attachments || []).find(
            (item) => String(item?._id || '') === String(req.params.attachmentId)
        );
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        const signed = createSignedDownloadUrl(attachment.storageKey, 90);
        return res.json({ success: true, url: signed.url, expiresAt: signed.expiresAt });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

if (process.env.NODE_ENV !== 'test') { 
    const PORT = Number(process.env.PORT) || 3002;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

export {app};
