# Employee Management System

A comprehensive employee management system built with React, TypeScript, and Supabase. This system provides complete employee lifecycle management, project tracking, financial analysis, and role-based access control.

## 🎯 Overview

The Employee Management System is a full-featured web application that enables organizations to manage their workforce efficiently. It includes employee data management, project allocation, financial tracking, and comprehensive reporting capabilities.

## ✨ Key Features

### Employee Management
- **Comprehensive Employee Profiles**: 30+ fields covering all aspects of employee information
- **Bulk Upload**: Excel-based mass employee import with validation
- **Real-time Data**: Live updates with Supabase integration
- **Advanced Filtering**: Search and filter by department, status, mode, and more
- **Audit Trail**: Track who modified records and when

### Project Management
- **Project Tracking**: Monitor project timelines and budgets
- **Employee Allocation**: Assign employees to projects with allocation percentages
- **Client Management**: Track client information and project relationships
- **Status Monitoring**: Active, Completed, On Hold, and Cancelled project states

### Financial Analysis
- **Currency Support**: Multi-currency support (INR, USD, EUR) with live exchange rates
- **Cost Tracking**: CTC, billing rates, and billability percentages
- **Revenue Analysis**: Project-based revenue tracking
- **Bench Management**: Monitor bench days and resource utilization

### User Management
- **Role-based Access**: Admin, Lead, and HR roles with different permissions
- **Authentication**: Secure login with Supabase Auth
- **User Profiles**: Comprehensive user account management
- **Notifications**: Real-time notification system

## 🏗️ Technical Architecture

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Vite**: Fast build tool and development server
- **Lucide React**: Beautiful icon library

### Backend
- **Supabase**: Backend-as-a-Service with PostgreSQL database
- **Row Level Security**: Database-level security policies
- **Real-time**: Live data updates with Supabase subscriptions
- **Authentication**: Built-in user authentication and authorization

### Key Libraries
- **ExcelJS**: Excel file processing for bulk uploads
- **SweetAlert2**: Beautiful alert dialogs
- **React Hot Toast**: Toast notifications
- **XLSX**: Excel file parsing

## 📊 Database Schema

### Core Tables

#### `user_profiles`
- User accounts with role-based access (Admin, Lead, HR)
- Profile information and avatar support
- Audit timestamps

#### `employees`
- Complete employee information with 30+ fields
- Auto-calculated metrics (ageing, bench days)
- Serial numbering for easy reference
- Skills array and project relationships

#### `projects`
- Project management with client information
- Budget tracking and team size
- Status management and timeline tracking
- Currency and billing type support

#### `employee_projects`
- Many-to-many relationship between employees and projects
- Allocation percentages and role tracking
- Project timeline management

#### `dropdown_options`
- Configurable dropdown options for all form fields
- Dynamic field management
- Display order and active status

#### `notifications`
- Real-time notification system
- Role-based targeting
- Action buttons and expiration dates

### Security Features
- **Row Level Security**: Database-level access control
- **Role-based Policies**: Different permissions for Admin, Lead, and HR
- **Audit Trail**: Track all data modifications
- **Input Validation**: Comprehensive data validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Employee-Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (see Database Setup section)
   - Configure environment variables

4. **Configure environment variables**
   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:5173](http://localhost:5173) in your browser

### Default Login Credentials
- **Admin**: admin@company.com / admin1234
- **Lead**: lead@company.com / lead1234  
- **HR**: hr@company.com / hr1234

## 📋 Employee Data Structure

### Basic Information (6 fields)
- **S.No**: Sequential number
- **Employee ID**: Unique identifier
- **Name**: Employee full name (with email below)
- **Department**: Employee department
- **Designation**: Job title/role
- **Email**: Employee email (displayed under name)

### Management & Client Details (4 fields)
- **Mode of Management**: Managed Service, Direct Hire, Resource Augmentation, etc.
- **Client**: Client name if applicable
- **Billability Status**: Billable, Bench, Trainee, Buffer, ML, NA, etc.
- **PO Number**: Purchase Order number

### Project Information (5 fields)
- **Billing**: Billing frequency/method
- **Billing Last Active Date**: Date when employee was last active
- **Projects**: Project names/descriptions
- **Billability %**: Percentage of time billable (0-100)
- **PO Start Date**: PO Start Date
- **PO End Date**: PO End Date

### Experience & Skills (2 fields)
- **Experience Band**: Years of experience
- **Rate**: Hourly/daily rate in USD

### Financial Information (3 fields)
- **Ageing**: Days since last activity (with color coding)
- **CTC**: Cost to Company (annual salary)
- **Bench Days**: Days on bench (with color coding)

### Contact Information (2 fields)
- **Phone Number**: Primary contact number
- **Emergency Number**: Emergency contact

### Additional Fields (2 fields)
- **Remarks**: Additional notes/comments
- **Last Modified By**: User who last modified (audit log)

### Actions (1 field)
- **Actions**: Edit/Delete buttons

## 📁 Excel Template Usage

### Template Structure
The Excel template includes all 30 columns with proper formatting:

1. **S.No** - Sequential number for the employee
2. **Employee ID** - Unique identifier for the employee
3. **Name** - Full name of the employee
4. **Email** - Employee's email address
5. **Department** - Employee's department (Engineering, Design, Product, Marketing, Sales, HR)
6. **Designation** - Employee's job title/role
7. **Mode of Management** - How the employee is managed (Managed Service, Direct Hire, Resource Augmentation, etc.)
8. **Client** - Client name if applicable
9. **Billability Status** - Current billability status (Billable, Bench, Trainee, Buffer, ML, NA, etc.)
10. **PO Number** - Purchase Order number if applicable
11. **Billing** - Billing frequency or method
12. **Billing Last Active Date** - Date when employee was last active on a project
13. **Projects** - Project names or descriptions
14. **Billability %** - Percentage of time employee is billable (0-100)
15. **PO Start Date** - Start date of current project
16. **PO End Date** - End date of current project
17. **Experience Band** - Years of experience (0-2 years, 1-3 years, 3-5 years, 5-8 years, 8+ years)
18. **Rate** - Hourly/daily rate in USD
19. **Ageing** - Number of days since last activity
20. **CTC** - Cost to Company (annual salary)
21. **Bench Days** - Number of days on bench
22. **Phone Number** - Primary contact number
23. **Emergency Number** - Emergency contact number
24. **Remarks** - Additional notes or comments
25. **Last Modified By** - User who last modified the record (audit log)
26. **Joining Date** - Date when employee joined the company
27. **Contact Number** - Alternative contact number
28. **Location** - Employee's location
29. **Manager** - Reporting manager's name
30. **Skills** - Skills separated by semicolons (e.g., "JavaScript;React;Node.js")

### Usage Instructions

1. **Download the Template**: Use the `employee_template.xlsx` file as a starting point
2. **Fill in Data**: Replace the sample data with actual employee information
3. **Follow Format Guidelines**:
   - Use semicolons (;) to separate multiple skills
   - Use DD-MM-YYYY format for dates
   - Ensure Employee ID is unique for each employee
   - Leave fields empty if information is not available
4. **Upload**: Use the bulk upload feature in the application to import the Excel file

### Important Notes
- **Required Fields**: Employee ID, Name, Email, Department, Designation are mandatory
- **Data Validation**: The system will validate data during import
- **Skills Format**: Multiple skills should be separated by semicolons
- **Date Format**: All dates must be in DD-MM-YYYY format
- **Currency**: Rates and CTC should be in USD without currency symbols
- **Dropdown Options**: The downloadable Excel template includes dropdown lists for Department, Mode of Management, Billability Status, Experience Band, and Location

## 💱 Currency Management

### Supported Currencies
- **INR**: Indian Rupee (₹)
- **USD**: US Dollar ($)
- **EUR**: Euro (€)

### Exchange Rate API
The system uses `exchangerate-api.com` for live exchange rate updates:
- **API Endpoint**: `https://api.exchangerate-api.com/v4/latest/USD`
- **Free Tier**: No API key required
- **Update Frequency**: Manual updates via "Fetch Latest" button
- **Fallback**: Default rates if API is unavailable

### Currency Features
- **Multi-currency Support**: Display amounts in different currencies
- **Live Exchange Rates**: Fetch current exchange rates from external API
- **Currency Conversion**: Automatic conversion between currencies
- **Financial Analysis**: Currency-aware financial reporting

## 🔧 API Integration

### Supabase Integration
The system is fully integrated with Supabase for:

#### EmployeeService (`src/lib/employeeService.ts`)
- **CRUD Operations**: Create, Read, Update, Delete employees
- **Bulk Operations**: Bulk upload from Excel data
- **Search & Filtering**: Department, status, and mode-based filtering
- **Database Mapping**: Converts between Employee interface and database schema
- **Error Handling**: Comprehensive error handling for all operations

#### Excel Parser (`src/lib/excelParser.ts`)
- **Excel Parsing**: Handles quoted values and complex Excel structures
- **Data Validation**: Validates required fields, email formats, numeric values, and dates
- **Template Generation**: Creates downloadable Excel templates
- **Data Conversion**: Converts Excel rows to Employee objects

#### Enhanced useEmployees Hook (`src/hooks/useEmployees.ts`)
- **Real-time Data**: Fetches data from Supabase on component mount
- **State Management**: Manages loading states, errors, and employee data
- **Filtering**: Handles search, department, status, and mode filtering
- **Bulk Operations**: Manages bulk upload operations

## 🎨 User Interface Features

### Enhanced Filtering
- Department filter
- Billability Status filter  
- Mode of Management filter
- Search across name, email, employee ID, and client

### Comprehensive Excel Export
- All 30 columns included in export
- Proper data formatting
- Filename: `employees_comprehensive.xlsx`

### Visual Indicators
- **Billability Status**: Color-coded badges (Green for Billable, Yellow for Bench, etc.)
- **Bench Days**: Color-coded (Green for 0, Yellow for ≤30, Red for >30)
- **Ageing**: Color-coded (Green for 0, Yellow for ≤30, Red for >30)

### Responsive Design
- Table width: 1800px minimum for all columns
- Horizontal scroll for smaller screens
- Pagination support (10 items per page)

## 🔐 Security & Permissions

### Role-based Access Control

#### Admin Role
- Full system access
- User management
- System configuration
- All CRUD operations

#### Lead Role
- Employee management
- Project management
- Financial data access
- Limited user management

#### HR Role
- Employee data access
- Basic reporting
- Limited financial access
- No system configuration

### Security Features
- **Authentication Required**: All operations require user authentication
- **Role-based Access**: Admin, Lead, and HR roles have different permissions
- **Data Validation**: Input validation before database operations
- **Audit Trail**: Tracks who modified records last
- **Row Level Security**: Database-level access control

## 📈 Performance Features

### Database Optimization
- **Indexed Fields**: Database indexes on frequently queried fields
- **Efficient Queries**: Optimized SQL queries with proper joins
- **Pagination**: Server-side pagination for large datasets
- **Caching**: React state caching for better performance

### Frontend Optimization
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large data tables
- **Debounced Search**: Optimized search performance

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### Deployment Options
- **Vercel**: Recommended for React applications
- **Netlify**: Alternative deployment platform
- **AWS S3 + CloudFront**: For enterprise deployments
- **Docker**: Containerized deployment

## 🔧 Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build

### Code Structure
```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Employees/      # Employee management
│   ├── Projects/       # Project management
│   ├── Financial/      # Financial dashboard
│   ├── Settings/       # Settings and configuration
│   └── Layout/         # Layout components
├── contexts/           # React contexts
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── App.tsx            # Main application component
```

## 📊 Sample Data

The system comes with comprehensive sample data:

### Sample Employees (12 employees)
- **Engineering Team**: 5 employees across different roles
- **Design Team**: 2 UX designers
- **Product Team**: 2 product managers
- **Marketing Team**: 1 marketing manager
- **HR Team**: 2 HR professionals

### Sample Projects (5 projects)
- **E-commerce Platform**: TechCorp Inc
- **Mobile Banking App**: FinanceFirst Bank
- **Data Analytics Dashboard**: DataViz Solutions
- **Healthcare Management System**: MedTech Solutions
- **Learning Management System**: EduTech Global

### Dropdown Options
Pre-configured options for all form fields including:
- Departments (8 options)
- Designations (15 options)
- Experience Bands (5 options)
- Billability Status (7 options)
- Mode of Management (5 options)

## 🎯 Benefits

### For Business Users
- **Real-time Data**: Always see current employee information
- **Bulk Operations**: Efficiently manage large employee datasets
- **Data Integrity**: Validation ensures data quality
- **Easy Export**: Simple data export for reporting
- **Financial Integration**: Seamless integration with financial dashboard
- **Audit Compliance**: Track who modified records

### For Developers
- **Clean Architecture**: Separation of concerns with service layer
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance**: Optimized database queries and state management
- **Modern Stack**: Latest React and TypeScript features

### For System Administrators
- **Security**: Role-based access control and authentication
- **Audit Trail**: Track all data modifications
- **Scalability**: Database can handle large employee datasets
- **Backup**: Supabase provides automatic database backups
- **Monitoring**: Built-in performance monitoring

## 🔮 Future Enhancements

The system is fully functional with comprehensive features. Future enhancements could include:

1. **Real-time Updates**: WebSocket integration for live data updates
2. **Advanced Analytics**: Dashboard with charts and metrics
3. **Workflow Management**: Approval processes for employee changes
4. **Integration APIs**: Connect with HR and payroll systems
5. **Mobile Support**: Responsive design for mobile devices
6. **Advanced Reporting**: Custom report builder
7. **Document Management**: File upload and document storage
8. **Time Tracking**: Employee time tracking and timesheet management
9. **Performance Reviews**: Employee performance evaluation system
10. **Leave Management**: Vacation and leave tracking

## 📞 Support

For questions about the system or bulk upload process, please contact your system administrator.

## ✅ Status: COMPLETE

The Employee Management System is now fully functional with:
- **Real-time data persistence** in the cloud
- **Bulk upload capabilities** for mass employee import
- **Comprehensive filtering and search** with database queries
- **Professional error handling** and user feedback
- **Secure data access** with role-based permissions
- **Multi-currency support** with live exchange rates
- **Complete project management** with client tracking
- **Financial analysis** and reporting capabilities

All employee data is stored in Supabase and displayed in the comprehensive table with all 30 columns! 🎯