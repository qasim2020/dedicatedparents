import nodemailer from 'nodemailer';
import fs from 'fs/promises'; 
import hbs from 'hbs'; 
import createModel from './createModel.js';

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
    const model = await createModel('myapp-themes');
    const output = await model.findOne({ brand }).lean();

    const transporter = nodemailer.createTransport({
        host: output.brandEmailServerLoc.trim(),
        port: 465,
        secure: true,
        auth: {
            user: output.brandEmail.trim(),
            pass: output.brandEmailPassword.trim(),
        },
    });

    const html = await generateEmailContent({ type, template, context, msg });
    
    const mailOptions = {
        from: output.brandEmail,
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

export default sendMsgToEmail;
