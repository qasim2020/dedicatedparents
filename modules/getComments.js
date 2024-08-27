    
import createModel from './createModel.js';

const countComments = async function(req,res) {
    let modelComments = await createModel(`${req.params.brand}-comments`);
    let output = await modelComments.countDocuments({slug: req.params.slug}).lean();
    return output;
};

const getComments = async function(req,res) {

    let uniqueCode = req.query.uniqueCode;

    let model = await createModel(`${req.params.brand}-blogs`);
    let blog = await model.findOne({slug: req.params.slug}).lean();
    let commentsModel = await createModel(`${req.params.brand}-comments`);
    let output = await commentsModel.find({slug: blog.slug, replyTo: "none"}).lean();

    let result = await Promise.all( 
        output.map(async val => {
            return {
                comment: val, 
                replies: await model.find({replyTo: val._id.toString()}).sort({_id: 1}).lean()
            }
        }) 
    );

    if (uniqueCode) {
        // make sure its a valid secret code and then activate all the comments attached to this email
        result = result.map( val => {
            val.comment.editable = val.comment.uniqueCode == uniqueCode;
            val.replies = val.replies.map( tal => {
                tal.editable = tal.uniqueCode == uniqueCode
                return tal;
            });
            return val;
        });
        return result;
    } else {
        return result;
    }
};

export {
    getComments,
    countComments
};