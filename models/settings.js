import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    brandName: { type: String, default: 'Dedicated Parents' },
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#0f6ad8' },
  },
  {
    collection: 'settings',
    timestamps: false,
  }
);

const Settings = mongoose.models.DpSettings || mongoose.model('DpSettings', SettingsSchema);

export default Settings;
