import mongoose from 'mongoose';

const LogsSchema = new mongoose.Schema({}, { strict: false, collection: 'logs' });
const Logs = mongoose.models.DpLogs || mongoose.model('DpLogs', LogsSchema);

export default Logs;