import mongoose from 'mongoose';

const CausesSchema = new mongoose.Schema({}, { strict: false, collection: 'causes' });
const Causes = mongoose.models.DpCauses || mongoose.model('DpCauses', CausesSchema);

export default Causes;