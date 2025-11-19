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
    required: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
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

// Auto-increment s_no
employeeSchema.pre('save', async function(next) {
  if (this.isNew && !this.s_no) {
    const lastEmployee = await mongoose.model('Employee').findOne().sort({ s_no: -1 });
    this.s_no = lastEmployee ? lastEmployee.s_no + 1 : 1;
  }
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
