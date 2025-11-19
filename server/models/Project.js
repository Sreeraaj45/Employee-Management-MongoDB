import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  client: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Active'
  },
  po_number: {
    type: String,
    trim: true
  },
  budget: {
    type: Number,
    min: 0
  },
  team_size: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    trim: true
  },
  billing_type: {
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
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
projectSchema.index({ client: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ name: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
