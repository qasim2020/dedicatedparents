import createModel from './createModel.js';

const countComments = async function(req,res) {
    let modelComments = await createModel(`${req.params.brand}-comments`);
    let output = await modelComments.countDocuments({approved: "true", slug: req.params.slug}).lean();
    return output;
};

const getComments = async function(req,res) {

    let commentsModel = await createModel(`${req.params.brand}-comments`);
    let output = await commentsModel.find({slug: req.params.slug, approved: "true", replyTo: "none"}).lean();
    let result = await Promise.all( 
        output.map(async val => {
            return {
                comment: val, 
                replies: await commentsModel.find({replyTo: val._id.toString()}).sort({_id: 1}).lean()
            }
        }) 
    );
    return result;

};

export {
    getComments,
    countComments
};