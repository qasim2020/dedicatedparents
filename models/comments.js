import mongoose from 'mongoose';

const CommentsSchema = new mongoose.Schema({}, { strict: false, collection: 'comments' });
const Comments = mongoose.models.DpComments || mongoose.model('DpComments', CommentsSchema);

export default Comments;