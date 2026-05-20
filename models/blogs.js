import mongoose from 'mongoose';

const BlogsSchema = new mongoose.Schema({}, { strict: false, collection: 'blogs' });
const Blogs = mongoose.models.DpBlogs || mongoose.model('DpBlogs', BlogsSchema);

export default Blogs;