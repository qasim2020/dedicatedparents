import createModel from "./createModel.js";

const createTicket = async function(req,res) {

        let model = await createModel(`${req.params.brand}-tickets`);

        let output = await model.create({
            name: req.body.firstName + " " + req.body.lastName,
            email: req.body.email,
            comment: req.body.comment,
            meta: req.body.meta
        });
         
        if (!output) {
            return {
                status: 404, 
                error: "Something wrong"
            }
        } else {
            return {
                success: true
            };
        }

    };

export default createTicket;
