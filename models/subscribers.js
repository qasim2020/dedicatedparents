import mongoose from 'mongoose';

const SubscribersSchema = new mongoose.Schema({}, { strict: false, collection: 'subscribers' });
const Subscribers = mongoose.models.DpSubscribers || mongoose.model('DpSubscribers', SubscribersSchema);

export default Subscribers;