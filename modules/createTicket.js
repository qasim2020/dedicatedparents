import Tickets from '../models/tickets.js';

const createTicket = async function(req,res) {
    try {
        const { firstName, lastName, email, comment, meta } = req.body;

        if (!firstName || !lastName || !email || !comment) {
            return {
                status: 400,
                error: 'Required fields are missing.'
            };
        }

        const model = Tickets;

        let output = await model.create({
            name: `${firstName || ''} ${lastName || ''}`.trim(),
            email,
            comment,
            meta
        });
         
        if (!output) {
            return {
                status: 404, 
                error: "Something wrong"
            }
        } else {
            return {
                success: true,
                output,
            };
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        return {
            status: 500,
            error: 'Failed to create ticket.'
        };
    }

    };

export default createTicket;
