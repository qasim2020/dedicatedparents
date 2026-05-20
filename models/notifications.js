import mongoose from 'mongoose';

const NotificationsSchema = new mongoose.Schema({}, { strict: false, collection: 'notifications' });
const Notifications = mongoose.models.DpNotifications || mongoose.model('DpNotifications', NotificationsSchema);

export default Notifications;