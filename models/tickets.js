import mongoose from 'mongoose';

const TicketsSchema = new mongoose.Schema({}, { strict: false, collection: 'tickets' });
const Tickets = mongoose.models.DpTickets || mongoose.model('DpTickets', TicketsSchema);

export default Tickets;