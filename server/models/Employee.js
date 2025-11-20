import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  s_no: {
    type: Number
  },
  employee_id: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        // Allow null/empty or valid email format
        if (!v || v === '') return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  department: {
    type: String,
    trim: true,
    default: 'Not Specified'
  },
  designation: {
    type: String,
    trim: true,
    default: 'Not Specified'
  },
  mode_of_management: {
    type: String,
    trim: true
  },
  client: {
    type: String,
    trim: true
  },
  billability_status: {
    type: String,
    trim: true
  },
  po_number: {
    type: String,
    trim: true
  },
  billing: {
    type: String,
    trim: true
  },
  last_active_date: {
    type: Date
  },
  projects: {
    type: String,
    trim: true
  },
  billability_percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  project_start_date: {
    type: Date
  },
  project_end_date: {
    type: Date
  },
  experience_band: {
    type: String,
    trim: true
  },
  rate: {
    type: Number,
    min: 0
  },
  ageing: {
    type: Number,
    min: 0
  },
  bench_days: {
    type: Number,
    min: 0
  },
  phone_number: {
    type: String,
    trim: true
  },
  emergency_contact: {
    type: String,
    trim: true
  },
  ctc: {
    type: Number,
    min: 0
  },
  remarks: {
    type: String
  },
  last_modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile'
  },
  position: {
    type: String,
    trim: true
  },
  joining_date: {
    type: Date
  },
  contact_number: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  manager: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  date_of_separation: {
    type: Date
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

// Helper function to validate and clean date fields
const cleanDateField = function(dateValue) {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  
  // Try to parse the date
  const parsed = new Date(dateValue);
  if (isNaN(parsed.getTime())) {
    // Invalid date
    return null;
  }
  return parsed;
};

// Pre-save hook to clean date fields and auto-increment s_no
employeeSchema.pre('save', async function(next) {
  // Auto-increment s_no
  if (this.isNew && !this.s_no) {
    const lastEmployee = await mongoose.model('Employee').findOne().sort({ s_no: -1 });
    this.s_no = lastEmployee ? lastEmployee.s_no + 1 : 1;
  }
  
  // Clean date fields
  const dateFields = [
    'last_active_date',
    'project_start_date', 
    'project_end_date',
    'joining_date',
    'date_of_separation'
  ];
  
  dateFields.forEach(field => {
    if (this[field] !== undefined) {
      this[field] = cleanDateField(this[field]);
    }
  });
  
  next();
});

// Indexes
employeeSchema.index({ s_no: 1 }, { unique: true, sparse: true });
employeeSchema.index({ employee_id: 1 }, { unique: true });
employeeSchema.index({ email: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ billability_status: 1 });
employeeSchema.index({ client: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
