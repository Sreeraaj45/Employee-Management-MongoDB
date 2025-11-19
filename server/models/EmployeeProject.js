import mongoose from 'mongoose';

const employeeProjectSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  allocation_percentage: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date
  },
  role_in_project: {
    type: String,
    trim: true
  },
  po_number: {
    type: String,
    trim: true
  },
  billing_type: {
    type: String,
    enum: ['Monthly', 'Fixed', 'Daily', 'Hourly'],
    trim: true
  },
  billing_rate: {
    type: Number,
    min: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Indexes
employeeProjectSchema.index({ employee_id: 1 });
employeeProjectSchema.index({ project_id: 1 });
employeeProjectSchema.index({ employee_id: 1, project_id: 1 }, { unique: true });

const EmployeeProject = mongoose.model('EmployeeProject', employeeProjectSchema);

export default EmployeeProject;
