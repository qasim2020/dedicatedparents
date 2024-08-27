import nodemailer from 'nodemailer';
import createModel from './createModel.js';

const sendMsgToEmail = async function (req,res) {
    if ( !( req.body.msgText && req.body.toEmail && req.body.msgSubject ) ) return {
        status: 404, 
        error: "Sorry you missed some fields."
    };

    let mail  = await sendMail({ 
        msg: req.body.msgText, 
        toEmail: req.body.toEmail, 
        subject: req.body.msgSubject, 
        brand: req.params.brand
    });

    return {
        success: true
    };
};

const sendMail = async function({type, template, context, toEmail, subject, brand, msg}) { 
    // min essential params are toEmail, subject, brand, msg

    let model = await createModel(`myapp-themes`);
    let output = await model.findOne({brand: brand}).lean();

    let transporter = nodemailer.createTransport({
      host: output.brandEmailServerLoc.trim(), 
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: output.brandEmail.trim(), 
        pass: output.brandEmailPassword.trim(),
      },
    });

    let hbstemplate, html;

    if (context != undefined) {

        if (type == "database") {

            // I need type, context, toEmail, subject, brand, and msg
            hbstemplate = hbs.compile(msg);
            html = hbstemplate({data: context});

        } else {

            let file = await new Promise( (resolve, reject) => {

                fs.readFile(`./views/emails/${template}.hbs`, 'utf8', (err, data) => {
                    if (err) reject(err)
                    resolve(data);
                });

            });

            hbstemplate = hbs.compile(file);
            html = hbstemplate({data: context});

        }

    } else {

        html = msg; // this is now a simple MSG

    }

    var mail = {
       from: output.brandEmail,
       to: toEmail,
       subject: subject,
       html: html
    }

    const info = await transporter.sendMail(mail);

    return info;

};

export default sendMsgToEmail;