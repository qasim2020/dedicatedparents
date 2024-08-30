import createModel from './createModel.js';
import sendEmailWithTemplate from './sendEmailWithTemplate.js';

const verifyEmail = async function(req,res) {

    let model = await createModel(`${req.params.brand}-subscribers`);
    let output = await model.findOneAndUpdate({
        email: req.query.email,
        _id: req.query.uniqueCode,
        validation: false 
    },{
        validation: true,
    },{
        new: true
    });

    if (output != null) {
        // sendEmailWithTemplate(req.params.brand, 'welcome-email', output);
        return {
            brand: req.params.brand,
            msg: 'Email Verified. Thank you for subscribing.'
        }
    } else {
        return {
            brand: req.params.brand,
            msg: 'Sorry — this link does not exist.'
        }
    }

};

export default verifyEmail;