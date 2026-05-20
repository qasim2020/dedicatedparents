import nodemailer from 'nodemailer';
import fs from 'fs/promises'; 
import hbs from 'hbs'; 
import Themes from '../models/themes.js';
import { connect } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, })
.then(() => { console.log('MongoDB connected'); })
.catch((err) => { console.error('MongoDB connection error:', err); }); 

const sendMsgToEmail = async (req, res) => {
    const { msgText, toEmail, msgSubject } = req.body;
    const { brand } = req.params;

    if (!msgText || !toEmail || !msgSubject) {
        return {
            status: 404,
            error: "Required fields are missing."
        };
    }

    try {
        await sendMail({ 
            msg: msgText, 
            toEmail, 
            subject: msgSubject, 
            brand 
        });

        return { success: true };
    } catch (error) {
        console.error("Error sending email:", error);
        return { 
            status: 500, 
            error: "Failed to send email." 
        };
    }
};

const sendMail = async ({ type, template, context, toEmail, subject, brand, msg }) => {
    const model = Themes;
    const output = await model.findOne({ brand }).lean();

    // Fallback to .env mail config when brand theme is not present in DB.
    const host = output?.brandEmailServerLoc?.trim() || process.env.EMAIL_HOST;
    const user = output?.brandEmail?.trim() || process.env.EMAIL_USER;
    const pass = output?.brandEmailPassword?.trim() || process.env.EMAIL_PASSWORD;

    if (!host || !user || !pass) {
        throw new Error('Email settings are not configured. Please update settings first.');
    }

    const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.EMAIL_PORT || 465),
        secure: (process.env.EMAIL_SSL || 'true') === 'true',
        auth: {
            user,
            pass,
        },
    });

    const html = await generateEmailContent({ type, template, context, msg });
    
    const mailOptions = {
        from: user,
        to: toEmail,
        subject,
        html,
    };

    return await transporter.sendMail(mailOptions);
};

const generateEmailContent = async ({ type, template, context, msg }) => {
    if (context) {
        if (type === "database") {
            const hbstemplate = hbs.compile(msg);
            return hbstemplate({ data: context });
        } else {
            const file = await fs.readFile(`./views/emails/${template}.hbs`, 'utf8');
            const hbstemplate = hbs.compile(file);
            return hbstemplate({ data: context });
        }
    }
    
    // Return plain message if no context is provided
    return msg;
};

export {
    sendMail,
    sendMsgToEmail
};
