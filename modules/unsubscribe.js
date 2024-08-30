import createModel from './createModel.js';

const unsubscribe = async function(req,res) {
    let model = await createModel(`${req.params.brand}-subscribers`);
    let output = await model.deleteOne({_id: req.query.Id, email: req.query.email}).lean();

    if (output != null) {
        return {
            msg: 'You have successfully unsubscribed from my mailing list. You will not receive my future newsletters / important announcements and most cool things I am doing. :p',
            brand: req.params.brand
        }
    } else {
        return {
            msg: 'Sorry something bad happened. Please leave an email to Qasim at <!-- <a href="mailto:qasimali24@gmail.com>qasimali24@gmail.com</a> --> and he will manually unsubscribe you.',
            brand: req.params.brand
        }
    };

};


export default unsubscribe;