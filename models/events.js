import mongoose from 'mongoose';

const EventsSchema = new mongoose.Schema({}, { strict: false, collection: 'events' });
const Events = mongoose.models.DpEvents || mongoose.model('DpEvents', EventsSchema);

export default Events;