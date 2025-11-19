import mongoose from 'mongoose';

const notificationReadSchema = new mongoose.Schema({
  notification_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: true
  },
  read_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'read_at', updatedAt: false }
});

// Indexes
notificationReadSchema.index({ notification_id: 1, user_id: 1 }, { unique: true });
notificationReadSchema.index({ user_id: 1 });

const NotificationRead = mongoose.model('NotificationRead', notificationReadSchema);

export default NotificationRead;
