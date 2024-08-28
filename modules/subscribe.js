import { sendMail } from './sendMsgToEmail.js';
import createModel from './createModel.js';

const subscribe = async function(req, res) {
    try {
        const { brand } = req.params;
        const { email, firstName, lastName } = req.body;

        const model = await createModel(`${brand}-subscribers`);
        
        const isSubscribed = await checkSubscription(model, email);
        if (isSubscribed) {
            return {
                status: 404,
                error: 'You have already subscribed to the mailing list'
            };
        }

        const subscriber = await addOrUpdateSubscriber(model, { firstName, lastName, email });
        const verifyUrl = generateVerificationUrl(brand, email, subscriber._id);
        
        const mailResponse = await sendVerificationEmail.call(this, brand, subscriber, verifyUrl);

        await logMailEvent.call(this, brand, email, mailResponse);
        
        return { output: subscriber };
    } catch (error) {
        console.error("Error in subscription process:", error);
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
    return `${process.env.url}/${brand}/gen/page/verifyEmail/n?email=${email}&uniqueCode=${id}`;
};

const sendVerificationEmail = async function(brand, subscriber, verifyUrl) {
    const mailModel = await this.createModel(`${brand}-newsletters`);
    const mailTemplate = await mailModel.findOne({ slug: "verify-email" }).lean();

    const emailOptions = mailTemplate ? {
        type: "database",
        from: process.env.zoho,
        context: {
            firstName: subscriber.firstName,
            lastName: subscriber.lastName,
            _id: subscriber._id,
            env: process.env.url,
            email: subscriber.email,
        },
        toEmail: subscriber.email,
        msg: mailTemplate.body,
        subject: mailTemplate.subject,
        brand,
    } : {
        from: process.env.zoho,
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
    const logModel = await createModel(`${brand}-log`);
    await logModel.create({
        status: 200,
        text: `Email ${mailResponse.slug || 'verify-email'} sent to ${email}`,
        meta: JSON.stringify(mailResponse),
    });
};

export default subscribe;

