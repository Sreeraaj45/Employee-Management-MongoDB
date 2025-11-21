import mongoose from 'mongoose';

const skillResponseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  employee_id: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  selected_skills: [{
    type: String,
    trim: true
  }],
  skill_ratings: [{
    skill: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    section: {
      type: String,
      trim: true
    }
  }],
  additional_skills: {
    type: String,
    trim: true
  },
  submitted_at: {
    type: Date,
    default: Date.now
  },
  // Manager review fields
  manager_ratings: [{
    skill: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  }],
  company_expectations: [{
    skill: {
      type: String,
      required: true,
      trim: true
    },
    expectation: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  }],
  rating_gaps: [{
    skill: {
      type: String,
      required: true,
      trim: true
    },
    gap: {
      type: Number,
      required: true
    }
  }],
  overall_manager_review: {
    type: String,
    trim: true
  },
  manager_review_timestamp: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
skillResponseSchema.index({ employee_id: 1 });
skillResponseSchema.index({ email: 1 });
skillResponseSchema.index({ submitted_at: -1 });

const SkillResponse = mongoose.model('SkillResponse', skillResponseSchema);

export default SkillResponse;
