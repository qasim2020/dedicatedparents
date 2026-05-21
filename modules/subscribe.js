import { sendMail } from './sendMsgToEmail.js';
import Subscribers from '../models/subscribers.js';
import Newsletters from '../models/newsletters.js';
import Logs from '../models/logs.js';

const subscribe = async function(req, res) {
    try {
        const { brand } = req.params;
        const { firstName, lastName } = req.body;
        const email = String(req.body.email || '').trim().toLowerCase();

        if (!firstName || !lastName || !email) {
            return {
                status: 400,
                error: 'Required fields are missing.'
            };
        }

        const model = Subscribers;
        
        const isSubscribed = await checkSubscription(model, email);
        if (isSubscribed) {
            return {
                status: 404,
                error: 'You have already subscribed to the mailing list'
            };
        }

        const subscriber = await addOrUpdateSubscriber(model, { firstName, lastName, email });
        const verifyUrl = generateVerificationUrl(brand, email, subscriber._id);
        let mailResponse = null;
        let mailWarning = null;

        try {
            mailResponse = await sendVerificationEmail(brand, subscriber, verifyUrl);
            await logMailEvent(brand, email, mailResponse);
        } catch (mailError) {
            console.log(mailError);
            mailWarning = mailError?.message || 'Verification email failed to send.';
        }

        return {
            success: true,
            output: subscriber,
            emailSent: Boolean(mailResponse),
            warning: mailWarning,
        };

    } catch (error) {
        console.log(error);
        return { 
            status: 500, 
            error: 'Failed to process subscription request.'
        };
    }
};

const checkSubscription = async (model, email) => {
    return await model.findOne({
        email,
        validation: true,
        isUnsubscribed: false,
    }).lean();
};

const addOrUpdateSubscriber = async (model, subscriberData) => {
    return await model.findOneAndUpdate(
        { email: subscriberData.email },
        {
            ...subscriberData,
            validation: false,
            isUnsubscribed: false,
            list: "public"
        },
        { upsert: true, new: true }
    );
};

const generateVerificationUrl = (brand, email, id) => {
    return `${process.env.DOMAIN_URL}/verifyEmail/n?email=${email}&uniqueCode=${id}`;
};

const sendVerificationEmail = async function(brand, subscriber, verifyUrl) {
    const mailModel = Newsletters;
    const mailTemplate = await mailModel.findOne({ slug: "verify-email" }).lean();

    const emailOptions = mailTemplate ? {
        type: "database",
        from: process.env.EMAIL_USER,
        context: {
            firstName: subscriber.firstName,
            lastName: subscriber.lastName,
            _id: subscriber._id,
            env: process.env.DOMAIN_URL,
            email: subscriber.email,
        },
        toEmail: subscriber.email,
        msg: mailTemplate.body,
        subject: mailTemplate.subject,
        brand,
    } : {
        from: process.env.EMAIL_USER,
        template: 'verifyEmail',
        context: {
            verifyUrl,
            Id: subscriber._id,
            email: subscriber.email,
        },
        toEmail: subscriber.email,
        subject: 'Verify Email',
        brand,
    };

    return await sendMail(emailOptions);
};

const logMailEvent = async function(brand, email, mailResponse) {
    const logModel = Logs;
    await logModel.create({
        status: 200,
        text: `Email ${mailResponse.slug || 'verify-email'} sent to ${email}`,
        meta: JSON.stringify(mailResponse),
    });
};

export default subscribe;
