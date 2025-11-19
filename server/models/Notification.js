import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'employee_created',
      'employee_updated',
      'employee_deleted',
      'project_created',
      'project_updated',
      'project_deleted',
      'user_created',
      'user_updated',
      'user_deleted',
      'bulk_upload_completed',
      'system_announcement'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  target_roles: [{
    type: String,
    enum: ['Admin', 'Lead', 'HR', 'Delivery Team']
  }],
  target_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile'
  },
  action_url: {
    type: String,
    trim: true
  },
  action_label: {
    type: String,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date
  },
  read_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Indexes
notificationSchema.index({ target_roles: 1 });
notificationSchema.index({ target_user_id: 1 });
notificationSchema.index({ created_at: -1 });
notificationSchema.index({ is_read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
