import mongoose from 'mongoose';

const dropdownOptionSchema = new mongoose.Schema({
  field_name: {
    type: String,
    required: true,
    trim: true
  },
  option_value: {
    type: String,
    required: true,
    trim: true
  },
  display_order: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
dropdownOptionSchema.index({ field_name: 1 });
dropdownOptionSchema.index({ field_name: 1, option_value: 1 }, { unique: true });

const DropdownOption = mongoose.model('DropdownOption', dropdownOptionSchema);

export default DropdownOption;
