import mongoose from 'mongoose';

const UsersSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const Users = mongoose.models.DpUsers || mongoose.model('DpUsers', UsersSchema);

export default Users;