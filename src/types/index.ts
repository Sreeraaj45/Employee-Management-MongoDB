export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Lead' | 'HR';
  avatar?: string;
}

export interface EmployeeProject {
  id: string;
  projectId: string;
  projectName: string;
  client: string;
  allocationPercentage: number;
  startDate: string;
  endDate?: string;
  roleInProject?: string;
  poNumber: string; // PO number is strictly tied to the project
  poAmendments?: Array<{
    id: string;
    po_number: string;
    start_date: string;
    end_date?: string;
    is_active: boolean;
  }>;
}

export interface Employee {
  id: string;
  sNo: number;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  modeOfManagement: string;
  client: string;
  billabilityStatus: string; // Made flexible to match form options
  poNumber?: string;
  billing?: string;
  // billingCurrency?: 'INR' | 'USD' | 'EUR'; // Currency for billing rate - DISABLED
  lastActiveDate?: string;
  projects?: string; // Keep for backward compatibility
  employeeProjects?: EmployeeProject[]; // New field for multiple projects
  billabilityPercentage: number;
  projectStartDate?: string;
  projectEndDate?: string;
  experienceBand: string;
  rate: number;
  // rateCurrency?: 'INR' | 'USD' | 'EUR'; // Currency for rate - DISABLED
  ageing: number;
  benchDays: number;
  phoneNumber: string;
  emergencyContact: string;
  ctc: number;
  // ctcCurrency?: 'INR' | 'USD' | 'EUR'; // Currency for CTC - DISABLED
  remarks?: string;
  lastModifiedBy: string;
  lastUpdated: string;
  
  // Legacy fields for backward compatibility
  position: string;
  joiningDate: string;
  location: string;
  manager: string;
  skills: string[];
  dateOfSeparation?: string;
}

export interface DropdownOption {
  id: string;
  fieldName: string;
  optionValue: string;
  displayOrder: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'On Hold';
  currency: 'INR' | 'USD' | 'EUR';
  teamSize: number;
}

export interface DashboardMetrics {
  totalEmployees: number;
  billableEmployees: number;
  benchEmployees: number;
  billabilityPercentage: number;
  avgBenchDays: number;
  departmentDistribution: { [key: string]: number };
  ageingDistribution: { [key: string]: number };
  clientDistribution: Record<string, number>;
  projectDistribution: Record<string, number>;
}

export type ConflictType = 'employee_id' | 'email' | 'both_id_and_email';

export interface FieldDifference {
  field: keyof Employee;
  existingValue: string;
  excelValue: string;
}

export interface ConflictData {
  rowNumber: number;
  excelRow: any; // ExcelRow from excelParser
  excelEmployee: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>;
  existingEmployee: Employee;
  conflictType: ConflictType;
  fieldDifferences: FieldDifference[];
}

export interface ConflictResolution {
  conflictId: string; // Unique identifier for the conflict
  action: 'keep_existing' | 'use_excel' | 'merge';
  selectedFields?: Partial<Employee>; // For merge action
}

export type NotificationType = 
  | 'employee_created'
  | 'employee_updated' 
  | 'employee_deleted'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'bulk_upload_completed'
  | 'system_announcement';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetRoles: ('Admin' | 'Lead' | 'HR')[];
  targetUserId?: string;
  actionUrl?: string;
  actionLabel?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  expiresAt?: string;
  isRead: boolean;
  readAt?: string;
  readBy?: string;
}

export interface NotificationRead {
  id: string;
  notificationId: string;
  userId: string;
  readAt: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  targetRoles?: ('Admin' | 'Lead' | 'HR')[];
  targetUserId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: string;
}