import mongoose from 'mongoose';

const poAmendmentSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  po_number: {
    type: String,
    required: true,
    trim: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: true
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
poAmendmentSchema.index({ project_id: 1 });
poAmendmentSchema.index({ is_active: 1 });

const POAmendment = mongoose.model('POAmendment', poAmendmentSchema);

export default POAmendment;
