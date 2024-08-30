import createModel from './createModel.js';
import convertStringToArticle from './convertStringToArticle.js';
import { sendMail } from './sendMsgToEmail.js';

const sendEmailWithTemplate = async function(brand, templateSlug, subscriber) {

    let model = await createModel(`${brand}-newsletters`);
    let output = await model.findOne({slug: templateSlug}).lean();

    if (output == null) return console.log( chalk.bold.red( 'COULD NOT SEND MAIL BECAUSE SLUG WAS NOT FOUND' ) );

    await sendMail(
        {
            from: `Dedicated Parents<${process.env.zoho}>`,
            template: output.subject,
            context: {
                body: output.body, 
                Id: subscriber._id,
                email: subscriber.email ,
                url: process.env.url, 
                unsubscribeUrl: process.env.url+`/unsubscribeMe/n?email=${subscriber.email}&Id=${subscriber._id}`
            }, 
            toEmail: subscriber.email, 
            subject: output.subject, 
            brand: brand
        }
    );

};

export default sendEmailWithTemplate;