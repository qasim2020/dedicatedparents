import mongoose from 'mongoose';

const ThemesSchema = new mongoose.Schema({}, { strict: false, collection: 'myapp-themes' });
const Themes = mongoose.models.DpThemes || mongoose.model('DpThemes', ThemesSchema);

export default Themes;