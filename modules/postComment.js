import Comments from '../models/comments.js';

const postComment = async function(req,res) {

        const model = Comments;

        const output = await model.create({
            name: req.body.name,
            email: req.body.email,
            comment: req.body.comment,
            replyTo: req.body.replyTo, 
            slug: req.body.slug, 
            approved: "false"
        });

        return {
            success: {
                _id : output._id,
                name: output.name, 
                comment: output.comment 
            }
        };

    };

export default postComment;
