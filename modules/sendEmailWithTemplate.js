import chalk from 'chalk';
import { sendMail } from './sendMsgToEmail.js';
import Newsletters from '../models/newsletters.js';

const sendEmailWithTemplate = async function(brand, templateSlug, subscriber) {

    const model = Newsletters;
    let output = await model.findOne({slug: templateSlug}).lean();

    if (output == null) return console.log( chalk.bold.red( 'COULD NOT SEND MAIL BECAUSE SLUG WAS NOT FOUND' ) );

    await sendMail(
        {
            from: `Dedicated Parents<${process.env.EMAIL_USER}>`,
            template: output.subject,
            context: {
                body: output.body, 
                Id: subscriber._id,
                email: subscriber.email ,
                url: process.env.DOMAIN_URL,
                unsubscribeUrl: process.env.DOMAIN_URL+`/unsubscribeMe/n?email=${subscriber.email}&Id=${subscriber._id}`
            }, 
            toEmail: subscriber.email, 
            subject: output.subject, 
            brand: brand
        }
    );

};

export default sendEmailWithTemplate;