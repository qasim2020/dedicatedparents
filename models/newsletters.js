import mongoose from 'mongoose';

const NewslettersSchema = new mongoose.Schema({}, { strict: false, collection: 'newsletters' });
const Newsletters = mongoose.models.DpNewsletters || mongoose.model('DpNewsletters', NewslettersSchema);

export default Newsletters;