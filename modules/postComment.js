import createModel from "./createModel.js";

const postComment = async function(req,res) {

        let model = await createModel(`${req.params.brand}-comments`);

        let output = model.create({
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
