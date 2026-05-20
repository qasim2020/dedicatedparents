import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({}, { strict: false, collection: 'team' });
const Team = mongoose.models.DpTeam || mongoose.model('DpTeam', TeamSchema);

export default Team;