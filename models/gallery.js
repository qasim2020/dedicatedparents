import mongoose from 'mongoose';

const GallerySchema = new mongoose.Schema({}, { strict: false, collection: 'gallery' });
const Gallery = mongoose.models.DpGallery || mongoose.model('DpGallery', GallerySchema);

export default Gallery;