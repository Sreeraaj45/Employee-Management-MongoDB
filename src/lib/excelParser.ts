import { Employee, ConflictData, ConflictType, FieldDifference } from '../types';

export interface ExcelRow {
  'S.No': string;
  'Employee ID': string;
  'Name': string;
  'Email': string;
  'Department': string;
  'Designation': string;
  'Mode of Management': string;
  'Client': string;
  'Billability Status': string;
  'PO Number': string;
  'Billing': string;
  'Billing Last Active Date': string;
  'Projects': string;
  'Billability %': string;
  'PO Start Date': string;
  'PO End Date': string;
  'Experience Band': string;
  'Rate': string;
  'Ageing': string;
  'CTC': string;
  'Bench Days': string;
  'Phone Number': string;
  'Emergency Number': string;
  'Remarks': string;
  'Last Modified By': string;
  'Joining Date': string;
  'Location': string;
  'Manager': string;
  'Skills': string;
  // New fields for enhanced project management
  'Project Name': string;
  'Project Client': string;
  'Allocation Percentage': string;
  'Project Start Date': string;
  'Project End Date': string;
  'Role in Project': string;
  'Date of Separation': string;
}

export class ExcelParser {
  // Parse Excel string to array of objects
  static parseExcel(excelText: string): ExcelRow[] {
    const lines = excelText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Excel must have at least a header row and one data row');
    }

    // Normalize headers (convert to lowercase and remove special characters)
    const rawHeaders = this.parseExcelRow(lines[0]);
    const headers = rawHeaders.map(header =>
      this.normalizeHeader(header)
    );

    const dataRows: ExcelRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseExcelRow(lines[i]);
      if (values.length === 0) continue; // Skip empty lines

      const row: any = {};
      headers.forEach((normalizedHeader, index) => {
        // Map normalized headers back to the expected ExcelRow keys
        const originalHeader = this.mapHeader(normalizedHeader);
        row[originalHeader] = values[index] || '';
      });
      
      // ✅ Filter out rows without Employee ID AND Name
      const hasEmployeeId = row['Employee ID'] && row['Employee ID'].trim() !== '';
      const hasName = row['Name'] && row['Name'].trim() !== '';
      
      if (hasEmployeeId && hasName) {
        dataRows.push(row as ExcelRow);
      }
    }

    return dataRows;
  }

  // Parse XLSX/XLS ArrayBuffer to ExcelRow[]
  static async parseXLSXToRows(arrayBuffer: ArrayBuffer): Promise<ExcelRow[]> {
    const { read, utils } = await import('xlsx');
    const wb = read(arrayBuffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    
    // Configure options to preserve date formats
    const rows: any[][] = utils.sheet_to_json(ws, { 
      header: 1, 
      blankrows: false,
      raw: true, // Get raw values to handle dates properly
      defval: '' // Default value for empty cells
    }) as any[][];
    
    if (!rows || rows.length < 2) {
      throw new Error('Excel must have at least a header row and one data row');
    }
    const rawHeaders = (rows[0] || []).map((h) => String(h || ''));
    const headers = rawHeaders.map((h) => this.normalizeHeader(h));
    const dataRows: ExcelRow[] = [];
    
    // Define date column headers for special handling
    const dateHeaders = [
      'Billing Last Active Date', 'PO Start Date', 'PO End Date', 
      'Joining Date', 'Project Start Date', 'Project End Date'
    ];
    
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      const row: any = {};
      headers.forEach((normalizedHeader, index) => {
        const originalHeader = this.mapHeader(normalizedHeader);
        let value = (values && values[index] != null ? values[index] : '') || '';
        
        // Special handling for date columns
        if (dateHeaders.includes(originalHeader) && value) {
          // Convert Excel date serial numbers or other formats to DD-MM-YYYY
          const originalValue = value;
          value = this.convertExcelDateToDDMMYYYY(value);
          // Debug logging for date conversion issues
          if (originalValue !== value && originalValue !== '') {
            console.log(`Date conversion: "${originalValue}" -> "${value}" for field "${originalHeader}"`);
          }
        } else {
          value = String(value);
        }
        
        row[originalHeader] = value;
      });
      
      // ✅ Filter out rows without Employee ID AND Name
      const hasEmployeeId = row['Employee ID'] && row['Employee ID'].trim() !== '';
      const hasName = row['Name'] && row['Name'].trim() !== '';
      
      if (hasEmployeeId && hasName) {
        dataRows.push(row as ExcelRow);
      }
    }
    return dataRows;
  }

  // Normalize header by converting to lowercase and removing special characters
  private static normalizeHeader(header: string): string {
    return header.toLowerCase()
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/[^a-z0-9 ]/g, '') // Remove special characters
      .trim();
  }

  // Helper method to map normalized headers to expected keys
  private static mapHeader(normalizedHeader: string): keyof ExcelRow {
    const headerMap: Record<string, keyof ExcelRow> = {
      'sno': 'S.No',
      'employee id': 'Employee ID',
      'name': 'Name',
      'email': 'Email',
      'department': 'Department',
      'designation': 'Designation',
      'mode of engagement': 'Mode of Management',
      'mode of management': 'Mode of Management',
      'client': 'Client',
      'billability status': 'Billability Status',
      'po number': 'PO Number',
      'billing': 'Billing',
      'billing last active date': 'Billing Last Active Date',
      'projects': 'Projects',
      'billability %': 'Billability %',
      'billability': 'Billability %',
      'po start date': 'PO Start Date',
      'po end date': 'PO End Date',
      'exp band': 'Experience Band',
      'experience band': 'Experience Band',
      'rate': 'Rate',
      'ageing': 'Ageing',
      'number of days on bench': 'Bench Days',
      'bench days': 'Bench Days',
      'phone number': 'Phone Number',
      'emergency contact': 'Emergency Number',
      'emergency number': 'Emergency Number',
      'ctc': 'CTC',
      'reamarks': 'Remarks',
      'remarks': 'Remarks',
      'last modified by': 'Last Modified By',
      'joining date': 'Joining Date',
      'location': 'Location',
      'manager': 'Manager',
      'skills': 'Skills',
      // New project fields
      'project name': 'Project Name',
      'project client': 'Project Client',
      'allocation percentage': 'Allocation Percentage',
      'project start date': 'Project Start Date',
      'project end date': 'Project End Date',
      'role in project': 'Role in Project',
      'date of separation': 'Date of Separation'
    };

    return headerMap[normalizedHeader] || normalizedHeader as keyof ExcelRow;
  }

  // Parse a single Excel row, handling quoted values
  private static parseExcelRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  }

  // Convert Excel date to DD-MM-YYYY format
  private static convertExcelDateToDDMMYYYY(value: any): string {
    if (!value) return '';
    
    const valueStr = String(value).trim();

    // ✅ ALLOW "Milestone" and "NA" as valid values
    if (valueStr.toLowerCase() === 'milestone' || valueStr.toLowerCase() === 'na' || valueStr.toLowerCase() === 'sow') {
      return valueStr;
    }
    
    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(valueStr)) {
      return valueStr;
    }
    
    // If it's an Excel serial date number (number between 1 and ~2958465)
    if (typeof value === 'number' && value > 0 && value < 2958466) {
      // Excel date serial number - convert to DD-MM-YYYY
      const excelEpoch = new Date(1900, 0, 1); // Excel epoch is 1900-01-01
      const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    // If it's a Date object
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    // Try to parse other common formats and convert to DD-MM-YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(valueStr)) {
      // YYYY-MM-DD format
      const [year, month, day] = valueStr.split('-');
      return `${day}-${month}-${year}`;
    }
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valueStr)) {
      // DD/MM/YYYY format
      const [day, month, year] = valueStr.split('/');
      return `${day}-${month}-${year}`;
    }
    
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(valueStr)) {
      // YYYY/MM/DD format
      const [year, month, day] = valueStr.split('/');
      return `${day}-${month}-${year}`;
    }
    
    // Try to parse MM/DD/YYYY format (US format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valueStr)) {
      const parts = valueStr.split('/');
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${day}-${month}-${year}`;
    }
    
    // Try to parse DD.MM.YYYY format (European format with dots)
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(valueStr)) {
      const [day, month, year] = valueStr.split('.');
      return `${day}-${month}-${year}`;
    }
    
    // Try to parse as ISO date string
    if (valueStr.includes('T') || valueStr.includes('Z')) {
      try {
        const date = new Date(valueStr);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Return original if can't parse
    return valueStr;
  }

  // Convert date from various formats to YYYY-MM-DD
  private static convertDate(dateStr: string): string {
    if (!dateStr) return '';

    const trimmedDate = dateStr.trim();

    if (trimmedDate.toLowerCase() === 'milestone' || 
        trimmedDate.toLowerCase() === 'na' || 
        trimmedDate.toLowerCase() === 'sow') {
      return trimmedDate;
    }
    
    // ✅ ALLOW "Milestone" and "NA" as valid values (return as-is)
    if (trimmedDate.toLowerCase() === 'milestone' || trimmedDate.toLowerCase() === 'na' || trimmedDate.toLowerCase() === 'sow') {
      return trimmedDate;
    }

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      return trimmedDate;
    }

    // Try to parse DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedDate)) {
      const [day, month, year] = trimmedDate.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try to parse DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedDate)) {
      const [day, month, year] = trimmedDate.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Return original if can't parse
    return trimmedDate;
  }

  // Format date from YYYY-MM-DD to DD-MM-YYYY for display/export
  static formatDateToDDMMYYYY(dateStr?: string): string {
    if (!dateStr) return 'NA';
    
    const trimmedDate = dateStr.trim();
    
    // ✅ PRESERVE "Milestone", "NA", "SOW" as valid values
    if (trimmedDate.toLowerCase() === 'milestone' || 
        trimmedDate.toLowerCase() === 'na' || 
        trimmedDate.toLowerCase() === 'sow') {
      return trimmedDate;
    }
    
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedDate)) return trimmedDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      const [y, m, d] = trimmedDate.split('-');
      return `${d}-${m}-${y}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedDate)) {
      const [d, m, y] = trimmedDate.split('/');
      return `${d}-${m}-${y}`;
    }
    
    // Return original if can't parse (preserves special values)
    return trimmedDate;
  }

  // Convert Excel rows to Employee objects
  static excelRowsToEmployees(excelRows: ExcelRow[]): Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[] {
    // ✅ Safe row filtering
    const validRows = excelRows.filter(row => {
      const employeeId = row['Employee ID'];
      const name = row['Name'];
      
      // Safe null checking
      const hasEmployeeId = employeeId != null && String(employeeId).trim() !== '';
      const hasName = name != null && String(name).trim() !== '';
      
      return hasEmployeeId && hasName;
    });

    return validRows.map((row, index) => {
      // ✅ SAFE UTILITY FUNCTIONS
      const safeString = (value: any): string => {
        if (value === null || value === undefined) return '';
        return String(value).trim();
      };

      const safeToLowerCase = (value: any): string => {
        const str = safeString(value);
        return str.toLowerCase();
      };

      const safeNumber = (value: any, defaultValue: number = 0): number => {
        const str = safeString(value);
        if (!str) return defaultValue;
        const num = parseFloat(str);
        return isNaN(num) ? defaultValue : num;
      };

      const safeInt = (value: any, defaultValue: number = 0): number => {
        const str = safeString(value);
        if (!str) return defaultValue;
        const num = parseInt(str);
        return isNaN(num) ? defaultValue : num;
      };

      // ✅ NORMALIZE BILLABILITY STATUS
      const normalizeBillabilityStatus = (status: string, modeOfManagement: string): string => {
      const statusLower = safeString(status).toLowerCase();
      
      // ✅ FIXED: Keep NA as NA (don't convert to Bench)
      if (statusLower === 'na' || statusLower === 'n/a') {
        return 'NA';
      }
      
      switch (statusLower) {
        case 'billable':
        case 'billed':
        case 'billing':
          return 'Billable';
        case 'non-billable':
        case 'non billable':
        case 'non_billable':
        case 'not billable':
          return 'Non-Billable';
        case 'bench':
        case 'on bench':
        case 'on-bench':
          return 'Bench';
        case 'training':
        case 'in training':
          return 'Training';
        case 'shadowing':
        case 'shadow':
          return 'Shadowing';
        case 'trainee':
          return 'Trainee';
        case 'buffer':
          return 'Buffer';
        case 'ml':
        case 'maternity leave':
        case 'medical leave':
          return 'ML';
        default:
          // Return as-is if not recognized
          return status || 'Bench';
      }
    };

      // In excelRowsToEmployees method, update the project handling section:
let employeeProjects: any[] = [];

// Support multiple projects per employee
const projectName = safeString(row['Project Name']);
if (projectName) {
  const projectNames = projectName.split(';').map(p => p.trim()).filter(p => p);
  const projectClients = safeString(row['Project Client'] || row['Client'] || '').split(';').map(c => c.trim()).filter(c => c);
  const allocationPercentages = safeString(row['Allocation Percentage'] || '100').split(';').map(a => safeNumber(a, 100));
  const projectStartDates = safeString(row['Project Start Date'] || '').split(';').map(d => d.trim()).filter(d => d);
  const projectEndDates = safeString(row['Project End Date'] || '').split(';').map(d => d.trim()).filter(d => d);
  const rolesInProject = safeString(row['Role in Project'] || '').split(';').map(r => r.trim()).filter(r => r);
  const poNumbers = safeString(row['PO Number'] || '').split(';').map(p => p.trim()).filter(p => p);

  employeeProjects = projectNames.map((projectName, projectIndex) => {
    // CRITICAL FIX: Use specific project client, fallback to employee client
    const projectClient = projectClients[projectIndex] || 
                         projectClients[0] || 
                         safeString(row['Client']) || 
                         safeString(row['Project Client']);
    
    console.log(`📝 Processing project: ${projectName} for client: ${projectClient}`);
    
    return {
      id: '',
      projectId: '',
      projectName: projectName,
      client: projectClient, // This ensures project has correct client
      allocationPercentage: allocationPercentages[projectIndex] || allocationPercentages[0] || 100,
      startDate: this.convertDate(projectStartDates[projectIndex]) || this.convertDate(projectStartDates[0]) || '',
      endDate: this.convertDate(projectEndDates[projectIndex]) || this.convertDate(projectEndDates[0]) || undefined,
      roleInProject: rolesInProject[projectIndex] || rolesInProject[0] || undefined,
      poNumber: poNumbers[projectIndex] || poNumbers[0] || '',
      billing: safeString(row['Billing']) || 'Monthly',
      rate: safeNumber(row['Rate'], 0)
    };
  });
}


      // Create employee object with SAFE data processing
      const employee = {
        employeeId: safeString(row['Employee ID']),
        name: safeString(row['Name']),
        email: safeToLowerCase(row['Email']),
        department: safeString(row['Department']),
        designation: safeString(row['Designation']),
        modeOfManagement: safeString(row['Mode of Management']),
        client: safeString(row['Client']),
        billabilityStatus: normalizeBillabilityStatus(row['Billability Status'], row['Mode of Management']),
        poNumber: safeString(row['PO Number']),
        billing: safeString(row['Billing']),
        lastActiveDate: this.convertDate(safeString(row['Billing Last Active Date'])),
        projects: safeString(row['Projects'] || row['Project Name']),
        employeeProjects: employeeProjects,
        billabilityPercentage: Math.max(0, Math.min(100, safeNumber(row['Billability %'], 0))),
        // ✅ FIX: Use PO dates from Excel, fallback to project dates, then empty string
        projectStartDate: safeString(row['PO Start Date']) || (employeeProjects.length > 0 ? employeeProjects[0].startDate : ''),
        projectEndDate: safeString(row['PO End Date']) || (employeeProjects.length > 0 ? employeeProjects[0].endDate : undefined),
        experienceBand: safeString(row['Experience Band']),
        rate: Math.max(0, safeNumber(row['Rate'], 0)),
        ageing: Math.max(0, safeInt(row['Ageing'], 0)),
        benchDays: Math.max(0, safeInt(row['Bench Days'], 0)),
        phoneNumber: safeString(row['Phone Number']),
        emergencyContact: safeString(row['Emergency Number']),
        ctc: Math.max(0, safeNumber(row['CTC'], 0)),
        remarks: safeString(row['Remarks']),
        lastModifiedBy: safeString(row['Last Modified By']),
        position: safeString(row['Designation']),
        joiningDate: this.convertDate(safeString(row['Joining Date'])),
        location: safeString(row['Location']),
        manager: safeString(row['Manager']),
        skills: row['Skills'] ? safeString(row['Skills']).split(';').map(s => s.trim()).filter(s => s) : [],
        dateOfSeparation: (() => {
          const dosValue = safeString(row['Date of Separation']);
          const convertedDate = this.convertDate(dosValue);
          if (convertedDate && 
              convertedDate.trim() !== '' && 
              convertedDate.toLowerCase() !== 'na' && 
              convertedDate.toLowerCase() !== 'milestone' && 
              convertedDate.toLowerCase() !== 'sow') {
            return convertedDate;
          }
          return ''; // Explicitly set empty string for no separation date
        })(),
      };

      // Add row number for better error tracking
      (employee as any).__rowNumber = index + 2;

      return employee;
    });
  }
  // Validate Excel data
  static validateExcel(excelRows: ExcelRow[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const employeeIds = new Set<string>();
    const emails = new Set<string>();

    // ✅ Filter out rows without Employee ID or Name before validation
    const validRows = excelRows.filter(row => {
      const hasEmployeeId = row['Employee ID'] && row['Employee ID'].trim() !== '';
      const hasName = row['Name'] && row['Name'].trim() !== '';
      return hasEmployeeId && hasName;
    });

    validRows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index 0 is header, and we want 1-based row numbers

      // Required fields validation with clear messages
      // Note: We don't need to check for Employee ID and Name here since they're already filtered
      const empId = row['Employee ID'].trim();
      if (employeeIds.has(empId)) {
        errors.push(`Row ${rowNumber}: Duplicate Employee ID "${empId}" found. Each employee must have a unique ID.`);
      } else {
        employeeIds.add(empId);
      }

      // Email is now optional, but if provided, it must be unique and valid
      if (row['Email'] && row['Email'].trim() !== '') {
        const email = row['Email'].trim().toLowerCase();
        
        // Check for duplicate emails only if email is provided
        if (emails.has(email)) {
          errors.push(`Row ${rowNumber}: Duplicate Email "${email}" found. Each employee must have a unique email address.`);
        } else {
          emails.add(email);
        }
        
        // Email format validation (only if email is provided)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row['Email'])) {
          errors.push(`Row ${rowNumber}: Invalid email format "${row['Email']}". Please use format: user@company.com or leave empty.`);
        }
      }

      if (!row['Department'] || row['Department'].trim() === '') {
        errors.push(`Row ${rowNumber}: Department is required. Please specify which department the employee belongs to.`);
      }

      if (!row['Designation'] || row['Designation'].trim() === '') {
        errors.push(`Row ${rowNumber}: Designation/Job Title is required. Please specify the employee's job role.`);
      }

      // Numeric field validation with clear explanations
      if (row['Billability %'] && (isNaN(parseFloat(row['Billability %'])) || parseFloat(row['Billability %']) < 0 || parseFloat(row['Billability %']) > 100)) {
        errors.push(`Row ${rowNumber}: Billability Percentage must be a number between 0 and 100. Current value: "${row['Billability %']}"`);
      }

      if (row['Rate'] && (isNaN(parseFloat(row['Rate'])) || parseFloat(row['Rate']) < 0)) {
        errors.push(`Row ${rowNumber}: Rate must be a positive number (e.g., 150, 200.50). Current value: "${row['Rate']}"`);
      }

      if (row['CTC'] && (isNaN(parseFloat(row['CTC'])) || parseFloat(row['CTC']) < 0)) {
        errors.push(`Row ${rowNumber}: CTC (Cost to Company) must be a positive number. Current value: "${row['CTC']}"`);
      }

      if (row['Ageing'] && (isNaN(parseInt(row['Ageing'])) || parseInt(row['Ageing']) < 0)) {
        errors.push(`Row ${rowNumber}: Ageing must be a positive whole number (days). Current value: "${row['Ageing']}"`);
      }

      if (row['Bench Days'] && (isNaN(parseInt(row['Bench Days'])) || parseInt(row['Bench Days']) < 0)) {
        errors.push(`Row ${rowNumber}: Bench Days must be a positive whole number. Current value: "${row['Bench Days']}"`);
      }

      // Project allocation validation
      if (row['Allocation Percentage'] && (isNaN(parseFloat(row['Allocation Percentage'])) || parseFloat(row['Allocation Percentage']) < 0 || parseFloat(row['Allocation Percentage']) > 100)) {
        errors.push(`Row ${rowNumber}: Project Allocation Percentage must be between 0 and 100. Current value: "${row['Allocation Percentage']}"`);
      }

      // Enhanced date validation with better error messages
      const isValidDate = (dateStr: string): boolean => {
        if (!dateStr || dateStr.trim() === '') return true;

        const trimmedDate = dateStr.trim();
        
        // ✅ ALLOW "Milestone" and "NA" as valid values for project end dates
        if (trimmedDate.toLowerCase() === 'milestone' || trimmedDate.toLowerCase() === 'na' || trimmedDate.toLowerCase() === 'sow') {
          return true;
        }
        
        // Preferred format first - DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedDate)) {
          const [day, month, year] = trimmedDate.split('-');
          const dayNum = parseInt(day);
          const monthNum = parseInt(month);
          const yearNum = parseInt(year);
          
          // Basic validation
          if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
            return true;
          }
        }
        
        // Legacy formats
        const legacyFormats = [
          /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
          /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
          /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
          /^\d{2}\.\d{2}\.\d{4}$/ // DD.MM.YYYY
        ];

        return legacyFormats.some(format => format.test(trimmedDate));
      };
      const validateDateField = (fieldName: string, value: string, example: string) => {
        if (value && !isValidDate(value)) {
          errors.push(`Row ${rowNumber}: ${fieldName} must be in DD-MM-YYYY format, "Milestone", or "NA" (e.g., ${example}). Current value: "${value}"`);
        }
      };

      const validateMultipleDateField = (fieldName: string, value: string, example: string) => {
        if (value && value.trim()) {
          // Split by semicolon and validate each date
          const dates = value.split(';').map(d => d.trim()).filter(d => d);
          dates.forEach((date, index) => {
            if (!isValidDate(date)) {
              errors.push(`Row ${rowNumber}: ${fieldName} (project ${index + 1}) must be in DD-MM-YYYY format, "Milestone", or "NA" (e.g., ${example}). Current value: "${date}"`);
            }
          });
        }
      };

      validateDateField('Billing Last Active Date', row['Billing Last Active Date'], '15-08-2024');
      validateDateField('Joining Date', row['Joining Date'], '15-06-2024');
      validateMultipleDateField('Project Start Date', row['Project Start Date'], '01-03-2024');
      validateMultipleDateField('Project End Date', row['Project End Date'], '30-11-2024');

      // Phone number validation with enhanced regex
      if (row['Phone Number'] && row['Phone Number'].trim()) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(row['Phone Number'])) {
          errors.push(`Row ${rowNumber}: Phone Number contains invalid characters. Please use only numbers, spaces, hyphens, parentheses, and plus signs. Current value: "${row['Phone Number']}"`);
        } else if (row['Phone Number'].replace(/[\s\-\+\(\)]/g, '').length < 10) {
          errors.push(`Row ${rowNumber}: Phone Number appears to be too short. Please provide a valid phone number with at least 10 digits. Current value: "${row['Phone Number']}"`);
        }
      }

      // Emergency contact validation
      if (row['Emergency Number'] && row['Emergency Number'].trim()) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(row['Emergency Number'])) {
          errors.push(`Row ${rowNumber}: Emergency Contact Number contains invalid characters. Please use only numbers, spaces, hyphens, parentheses, and plus signs. Current value: "${row['Emergency Number']}"`);
        } else if (row['Emergency Number'].replace(/[\s\-\+\(\)]/g, '').length < 10) {
          errors.push(`Row ${rowNumber}: Emergency Contact Number appears to be too short. Please provide a valid phone number with at least 10 digits. Current value: "${row['Emergency Number']}"`);
        }
      }

      // Project validation - if Project Name is provided, ensure related fields are consistent
      if (row['Project Name'] && row['Project Name'].trim()) {
        const projectNames = row['Project Name'].trim().split(';').map(p => p.trim()).filter(p => p);
        const projectClients = (row['Project Client'] || row['Client'] || '').split(';').map(c => c.trim()).filter(c => c);
        const allocationPercentages = (row['Allocation Percentage'] || '100').split(';').map(a => a.trim()).filter(a => a);
        
        // Validate each project
        projectNames.forEach((projectName, index) => {
          const client = projectClients[index] || projectClients[0] || row['Client'];
          if (!client) {
            errors.push(`Row ${rowNumber}: Project Client is required for project "${projectName}". Please provide the client for this project.`);
          }
          
          const allocation = allocationPercentages[index] || allocationPercentages[0] || '100';
          if (allocation && !isNaN(parseFloat(allocation))) {
            const allocationValue = parseFloat(allocation);
            if (allocationValue < 0 || allocationValue > 100) {
              errors.push(`Row ${rowNumber}: Project Allocation Percentage for "${projectName}" must be between 0 and 100. Current value: "${allocation}"`);
            }
          }
        });
        
        // Validate total allocation doesn't exceed 100%
        const totalAllocation = allocationPercentages.reduce((sum, allocation) => {
          return sum + (parseFloat(allocation) || 0);
        }, 0);
        
        if (totalAllocation > 100) {
          errors.push(`Row ${rowNumber}: Total project allocation percentage cannot exceed 100%. Current total: ${totalAllocation}%`);
        }
      }

      // Skills validation
      if (row['Skills'] && row['Skills'].trim()) {
        const skills = row['Skills'].split(';').map(s => s.trim()).filter(s => s);
        if (skills.length === 0) {
          errors.push(`Row ${rowNumber}: Skills field contains only empty values. Please provide valid skills separated by semicolons (;).`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Detect conflicts between Excel data and existing employees
  static async detectConflicts(
    excelRows: ExcelRow[],
    existingEmployees: Employee[]
  ): Promise<{
    conflicts: ConflictData[];
    newEmployees: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[];
    validEmployees: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[];
  }> {
    const conflicts: ConflictData[] = [];
    const newEmployees: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[] = [];
    const validEmployees: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[] = [];

    // Create a map of existing employees by employee ID and email for quick lookup
    const existingByEmployeeId = new Map<string, Employee>();
    const existingByEmail = new Map<string, Employee>();

    existingEmployees.forEach(emp => {
      existingByEmployeeId.set(emp.employeeId.toLowerCase(), emp);
      existingByEmail.set(emp.email.toLowerCase(), emp);
    });

    // Convert Excel rows to employee data
    const excelEmployees = this.excelRowsToEmployees(excelRows);

    excelEmployees.forEach((excelEmployee, index) => {
      const excelRow = excelRows[index];
      const rowNumber = index + 2; // +2 because index 0 is header, and we want 1-based row numbers

      // Check for conflicts by employee ID
      const existingByEmpId = existingByEmployeeId.get(excelEmployee.employeeId.toLowerCase());
      // Check for conflicts by email (only if email is provided)
      const existingByEmpEmail = excelEmployee.email ? existingByEmail.get(excelEmployee.email.toLowerCase()) : undefined;

      if (existingByEmpId || existingByEmpEmail) {
        // Found a conflict
        const existingEmployee = existingByEmpId || existingByEmpEmail!;

        // Determine conflict type
        let conflictType: ConflictType;
        if (existingByEmpId && existingByEmpEmail && existingByEmpId.id !== existingByEmpEmail.id) {
          conflictType = 'both_id_and_email';
        } else if (existingByEmpId) {
          conflictType = 'employee_id';
        } else {
          conflictType = 'email';
        }

        conflicts.push({
          rowNumber,
          excelRow,
          excelEmployee,
          existingEmployee,
          conflictType,
          fieldDifferences: this.compareEmployeeFields(existingEmployee, excelEmployee)
        });
      } else {
        // No conflict - this is a new employee
        newEmployees.push(excelEmployee);
      }
    });

    // All employees without conflicts are valid
    validEmployees.push(...newEmployees);

    return {
      conflicts,
      newEmployees,
      validEmployees
    };
  }

  // Compare employee fields to identify differences
  // In ExcelParser class - update the compareEmployeeFields method
  // In ExcelParser class - update the compareEmployeeFields method
private static compareEmployeeFields(
  existing: Employee,
  excel: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>
): FieldDifference[] {
  const differences: FieldDifference[] = [];

  const fieldsToCompare: (keyof Employee)[] = [
    'name', 'email', 'department', 'designation', 'modeOfManagement',
    'client', 'billabilityStatus', 'poNumber', 'billing', 'lastActiveDate',
    'projects', 'billabilityPercentage', 'projectStartDate', 'projectEndDate',
    'experienceBand', 'rate', 'ageing', 'benchDays', 'phoneNumber',
    'emergencyContact', 'ctc', 'remarks', 'position', 'joiningDate',
    'location', 'manager', 'skills', 'dateOfSeparation'
  ];

  fieldsToCompare.forEach(field => {
    const existingValue = existing[field];
    const excelValue = excel[field as keyof typeof excel];

    // Handle different data types
    let existingStr = '';
    let excelStr = '';

    if (field === 'skills') {
      existingStr = Array.isArray(existingValue) ? existingValue.join('; ') : '';
      excelStr = Array.isArray(excelValue) ? excelValue.join('; ') : '';
    } else {
      existingStr = String(existingValue || '');
      excelStr = String(excelValue || '');
    }

    // ✅ SPECIAL HANDLING FOR PROJECTS FIELD - Handle default project conflicts
    if (field === 'projects') {
      const normalizedExisting = this.normalizeProjectsForComparison(existingStr, existing.client);
      const normalizedExcel = this.normalizeProjectsForComparison(excelStr, excel.client);
      
      // Don't report conflict if both have the same project or if it's a default project
      if (normalizedExisting !== normalizedExcel) {
        differences.push({
          field,
          existingValue: existingStr,
          excelValue: excelStr
        });
      }
    }
    // ✅ SPECIAL HANDLING FOR PROJECT DATE FIELDS - Ignore conflicts for special values
    else if (field === 'projectStartDate' || field === 'projectEndDate'  || field === 'dateOfSeparation') {
      const normalizedExisting = this.normalizeDateForComparison(existingStr);
      const normalizedExcel = this.normalizeDateForComparison(excelStr);
      
      // ✅ IGNORE conflict if Excel has special value and DB is empty
      const isSpecialValue = (value: string) => {
        const lowerValue = value.toLowerCase();
        return lowerValue === 'na' || lowerValue === 'milestone' || lowerValue === 'sow';
      };
      
      const isEmptyValue = (value: string) => {
        return !value || value.trim() === '' || value === 'NA';
      };
      
      // Don't report conflict if:
      // - Excel has special value and DB is empty/NA
      // - Both are empty/special values
      if ((isSpecialValue(normalizedExcel) && isEmptyValue(normalizedExisting)) ||
          (isEmptyValue(normalizedExcel) && isSpecialValue(normalizedExisting)) ||
          (isSpecialValue(normalizedExcel) && isSpecialValue(normalizedExisting))) {
        return; // Skip this field difference
      }
      
      // Regular date comparison for other cases
      if (normalizedExisting !== normalizedExcel) {
        differences.push({
          field,
          existingValue: existingStr,
          excelValue: excelStr
        });
      }
    } 
    // Special handling for other date fields
    else if (field.includes('Date') || field === 'lastActiveDate' || field === 'joiningDate') {
      const normalizedExisting = this.normalizeDateForComparison(existingStr);
      const normalizedExcel = this.normalizeDateForComparison(excelStr);
      
      if (normalizedExisting !== normalizedExcel) {
        differences.push({
          field,
          existingValue: existingStr,
          excelValue: excelStr
        });
      }
    } else {
      // Regular field comparison
      if (existingStr !== excelStr) {
        differences.push({
          field,
          existingValue: existingStr,
          excelValue: excelStr
        });
      }
    }
  });

  return differences;
}

// ✅ ADD THIS NEW METHOD to normalize projects for comparison
private static normalizeProjectsForComparison(projectsValue: string, clientName?: string): string {
  if (!projectsValue) return '';
  
  const projectsStr = String(projectsValue).trim();
  if (!projectsStr) return '';
  
  // If the project is the same as the client name, it's a default project
  // Treat default projects as equivalent to empty/not assigned
  if (clientName && projectsStr === clientName) {
    return ''; // Treat default project as "no project" for comparison
  }
  
  // Also handle cases where default project might be in different formats
  const defaultProjectPatterns = [
    `${clientName} - Default Project`,
    `__CLIENT_ONLY__${clientName}`,
    clientName // already handled above
  ];
  
  for (const pattern of defaultProjectPatterns) {
    if (projectsStr === pattern) {
      return ''; // Treat as "no project"
    }
  }
  
  return projectsStr;
}

// Add this new method to normalize dates for comparison
private static normalizeDateForComparison(dateStr: string): string {
  if (!dateStr) return '';
  
  const trimmedDate = dateStr.trim();
  
  // Preserve special values
  if (trimmedDate.toLowerCase() === 'milestone' || 
      trimmedDate.toLowerCase() === 'na' || 
      trimmedDate.toLowerCase() === 'sow') {
    return trimmedDate.toLowerCase();
  }
  
  // Try to parse and normalize date format
  try {
    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedDate)) {
      return trimmedDate;
    }
    
    // If in YYYY-MM-DD format, convert to DD-MM-YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      const [year, month, day] = trimmedDate.split('-');
      return `${day}-${month}-${year}`;
    }
    
    // If in other formats, try to parse and convert
    const dateFormats = [
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
      /^\d{2}\.\d{2}\.\d{4}$/  // DD.MM.YYYY
    ];
    
    for (const format of dateFormats) {
      if (format.test(trimmedDate)) {
        // Simple conversion for common formats
        if (trimmedDate.includes('/')) {
          const parts = trimmedDate.split('/');
          if (parts[0].length === 4) { // YYYY/MM/DD
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else { // DD/MM/YYYY
            return `${parts[0]}-${parts[1]}-${parts[2]}`;
          }
        } else if (trimmedDate.includes('.')) { // DD.MM.YYYY
          const parts = trimmedDate.split('.');
          return `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
      }
    }
  } catch (error) {
    console.warn('Date normalization failed for:', dateStr, error);
  }
  
  // Return original if can't parse
  return trimmedDate;
}

  // Get validation summary for better user feedback
  static getValidationSummary(excelRows: ExcelRow[]): {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateEmployeeIds: number;
    duplicateEmails: number;
    missingRequiredFields: number;
    invalidFormats: number;
  } {
    const validation = this.validateExcel(excelRows);
    const errors = validation.errors;
    
    const duplicateEmployeeIds = errors.filter(e => e.includes('Duplicate Employee ID')).length;
    const duplicateEmails = errors.filter(e => e.includes('Duplicate Email')).length;
    const missingRequiredFields = errors.filter(e => e.includes('is required')).length;
    const invalidFormats = errors.filter(e => e.includes('format') || e.includes('Invalid')).length;
    
    return {
      totalRows: excelRows.length,
      validRows: excelRows.length - errors.length,
      invalidRows: errors.length,
      duplicateEmployeeIds,
      duplicateEmails,
      missingRequiredFields,
      invalidFormats
    };
  }

  // Enhanced conflict detection with better categorization
  static async detectConflictsEnhanced(
    excelRows: ExcelRow[],
    existingEmployees: Employee[]
  ): Promise<{
    conflicts: ConflictData[];
    newEmployees: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[];
    validEmployees: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[];
    summary: {
      totalRows: number;
      conflictsFound: number;
      newEmployees: number;
      duplicateInExcel: number;
    };
  }> {
    const conflictAnalysis = await this.detectConflicts(excelRows, existingEmployees);
    
    // Check for duplicates within Excel itself
    const employeeIds = new Set<string>();
    const emails = new Set<string>();
    const duplicateInExcel = excelRows.filter(row => {
      const empId = row['Employee ID']?.trim();
      const email = row['Email']?.trim().toLowerCase();
      
      if (empId && employeeIds.has(empId)) return true;
      // Only check email duplicates if email is provided
      if (email && email !== '' && emails.has(email)) return true;
      
      if (empId) employeeIds.add(empId);
      if (email && email !== '') emails.add(email);
      return false;
    }).length;

    return {
      ...conflictAnalysis,
      summary: {
        totalRows: excelRows.length,
        conflictsFound: conflictAnalysis.conflicts.length,
        newEmployees: conflictAnalysis.newEmployees.length,
        duplicateInExcel
      }
    };
  }

  // Generate Excel template with dropdowns and DD-MM-YYYY dates
  static async generateTemplateXLSX(
    clients?: string[],
    projects?: string[],
    dropdownOptions?: { [key: string]: string[] }
  ): Promise<Blob> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Template');

    // ✅ Updated headers in the exact order you specified
    const headers = [
      'S.No', 'Employee ID', 'Name', 'Email', 'Department', 'Designation', 'Mode of Management',
      'Client', 'Billability Status', 'PO Number', 'Billing', 'Billing Last Active Date',
      'Projects', 'Billability %', 'PO Start Date', 'PO End Date', 'Experience Band', 'Rate',
      'Ageing', 'Bench Days', 'Phone Number', 'Emergency Number', 'CTC', 'Remarks', 'Last Modified By',
      'Joining Date', 'Location', 'Manager', 'Skills', 'Date of Separation'
    ];
    sheet.addRow(headers);

    // ✅ Updated sample data in the same order
    const sampleRow = [
      '1', 'IET0001', 'John Doe', 'john.doe@company.com', 'Engineering', 'Senior Developer',
      'Managed Service', 'Client A', 'Billable', 'PO0001', 'Monthly', '10-08-2024',
      'Project Alpha', '85', '15-02-2024', 'na', '5-8 years', '150',
      '365', '0', '9999999999', '8888888888', '800000', 'High performer', 'Manager Smith',
      '01-01-2024', 'Chennai', 'Jane Manager', 'JavaScript;React;Node.js', ''
    ];
    sheet.addRow(sampleRow);
    
    // ✅ Second sample row with different data
    const sampleRow2 = [
      '2', 'IET0002', 'Jane Smith', 'jane.smith@company.com', 'Engineering', 'Developer',
      'Direct Hire', 'MEI', 'Billable', 'PO0003', 'Monthly', '15-08-2024',
      'MEI Project', '100', '01-01-2024', 'Milestone', '3-5 years', '120',
      '200', '0', '9876543210', '8765432109', '600000', 'Good performer', 'Manager Smith',
      '01-02-2024', 'Bengaluru', 'John Manager', 'Python;Django;PostgreSQL', '11-12-2004'
    ];
    sheet.addRow(sampleRow2);

    // ✅ REMOVED dropdown validations to allow any data
    // Only keeping date format validation

    // Date columns formatting as text DD-MM-YYYY hint (by header)
    const dateHeaders = ['Billing Last Active Date', 'PO Start Date', 'PO End Date', 'Joining Date', 'Date of Separation'];
    dateHeaders.forEach((h) => {
      const idx = headers.indexOf(h);
      if (idx >= 0) {
        const col = sheet.getColumn(idx + 1);
        col.numFmt = '@'; // Set as text format
        // Add data validation to ensure DD-MM-YYYY format
        sheet.dataValidations.add(`${col.letter}2:${col.letter}1048576`, {
          type: 'custom',
          allowBlank: true,
          formulae: [`AND(LEN(${col.letter}2)=10,LEFT(${col.letter}2,2)*1<=31,MID(${col.letter}2,4,2)*1<=12,RIGHT(${col.letter}2,4)*1>=1900)`]
        });
      }
    });

    // Autosize columns a bit
    headers.forEach((h, idx) => {
      const col = sheet.getColumn(idx + 1);
      col.width = Math.max(15, h.length + 2);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}