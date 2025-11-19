import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Employee, ConflictData, ConflictResolution } from '../../types';
import { ExcelParser } from '../../lib/excelParser';
import { useEmployees } from '../../hooks/useEmployees';
import { useProjects } from '../../hooks/useProjects';
import { useDropdownOptions } from '../../hooks/useDropdownOptions';
import { ConflictResolutionModal } from '../Employees/ConflictResolutionModal';

interface BulkUploadProps {
  onUpload: (employees: Omit<Employee, 'id' | 'sNo' | 'lastUpdated'>[]) => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [validationSummary, setValidationSummary] = useState<any>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { allEmployees, bulkUploadEmployees, bulkUploadEmployeesWithConflicts } = useEmployees();
  const { clientNames, getProjectsForClient } = useProjects();
  const { options } = useDropdownOptions();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension || '')) {
      setUploadStatus('error');
      setUploadMessage('Please upload a valid Excel file.');
      return;
    }

    // ✅ Reset states properly - including validation summary
    setUploadStatus('processing');
    setUploadMessage('Processing file...');
    setUploadedCount(0);
    setUploadProgress('Reading file...');
    setProcessingSteps(['Reading file...']);
    setValidationSummary(null); // ✅ Clear previous validation summary
    setShowValidationDetails(false);

    try {
      let excelRowsParsed;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setUploadProgress('Parsing Excel file...');
        setProcessingSteps(prev => [...prev, 'Parsing Excel file...']);
        const buf = await file.arrayBuffer();
        excelRowsParsed = await ExcelParser.parseXLSXToRows(buf);
      } else {
        setUploadProgress('Parsing Excel file...');
        setProcessingSteps(prev => [...prev, 'Parsing Excel file...']);
        const buf = await file.arrayBuffer();
        excelRowsParsed = await ExcelParser.parseXLSXToRows(buf);
      }

      console.log(`Parsed ${excelRowsParsed.length} rows from file`);

      // Add delay for large files to ensure UI updates
      if (excelRowsParsed.length > 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setUploadProgress('Validating data...');
      setProcessingSteps(prev => [...prev, 'Validating data...']);

      // Validate the Excel data
      const validation = ExcelParser.validateExcel(excelRowsParsed);
      const summary = ExcelParser.getValidationSummary(excelRowsParsed);
      setValidationSummary(summary);

      if (!validation.isValid) {
        // ✅ IMPROVED: Better error message for duplicate IDs within file
        let errorMessage = '';
        
        if (validation.errors.some(e => e.includes('Duplicate Employee ID'))) {
          errorMessage = `Found duplicate Employee IDs within your file. Please ensure each employee has a unique ID.\n\n${validation.errors.filter(e => e.includes('Duplicate Employee ID')).slice(0, 3).join('\n')}${validation.errors.filter(e => e.includes('Duplicate Employee ID')).length > 3 ? `\n\n... and ${validation.errors.filter(e => e.includes('Duplicate Employee ID')).length - 3} more duplicate IDs.` : ''}`;
        } else if (validation.errors.some(e => e.includes('Duplicate Email'))) {
          errorMessage = `Found duplicate emails within your file. Please ensure each employee has a unique email.\n\n${validation.errors.filter(e => e.includes('Duplicate Email')).slice(0, 3).join('\n')}${validation.errors.filter(e => e.includes('Duplicate Email')).length > 3 ? `\n\n... and ${validation.errors.filter(e => e.includes('Duplicate Email')).length - 3} more duplicate emails.` : ''}`;
        } else {
          errorMessage = validation.errors.length === 1 
            ? validation.errors[0]
            : `Found ${validation.errors.length} validation errors:\n\n${validation.errors.slice(0, 5).join('\n')}${validation.errors.length > 5 ? `\n\n... and ${validation.errors.length - 5} more errors. Please download the template and check your data format.` : ''}`;
        }
        
        throw new Error(errorMessage);
      }

      setUploadProgress('Checking for conflicts with existing employees...');
      setProcessingSteps(prev => [...prev, 'Checking for conflicts...']);

      // Detect conflicts with enhanced analysis (this checks against existing database employees)
      const conflictAnalysis = await ExcelParser.detectConflictsEnhanced(excelRowsParsed, allEmployees);
      
      if (conflictAnalysis.conflicts.length > 0) {
        setExcelRows(excelRowsParsed);
        setConflicts(conflictAnalysis.conflicts);
        setShowConflictResolution(true);
        setUploadStatus('idle');
        setUploadMessage('');
        setUploadProgress('');
        setProcessingSteps([]);
        return;
      }

      setUploadProgress('Converting to employee data...');
      setProcessingSteps(prev => [...prev, 'Converting to employee data...']);

      // Convert to employee objects
      const employees = ExcelParser.excelRowsToEmployees(excelRowsParsed);

      if (employees.length === 0) {
        throw new Error('No valid employee data found in file');
      }

      console.log('Converted employees:', employees);

      // CRITICAL: Actually save to database using bulkUploadEmployees
      setUploadProgress('Saving to database...');
      setProcessingSteps(prev => [...prev, 'Saving to database...']);

      // Use the bulkUploadEmployees function from useEmployees hook
      const saveResult = await bulkUploadEmployees(employees);
      console.log('Bulk upload result:', saveResult);

      // Only show success after database operation is complete
      const savedCount = Array.isArray(saveResult) ? saveResult.length : 0;
      setUploadedCount(savedCount);
      
      // Add a small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 50));
      
      setUploadStatus('success');
      setUploadMessage(`Successfully processed and saved ${savedCount} employees to database`);
      setUploadProgress('');
      setProcessingSteps([]);
      
      // Also call onUpload for any parent component handling
      onUpload(employees);
      
    } catch (error) {
      console.error('Upload error:', {
        error,
        fileType: fileExtension,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      });
      
      setUploadStatus('error');
      let errorMessage = 'An unexpected error occurred while processing your file.';
      
      if (error instanceof Error) {
        if (error.message.includes('validation errors') || error.message.includes('Duplicate Employee ID') || error.message.includes('Duplicate Email')) {
          errorMessage = error.message;
        } else if (error.message.includes('Excel must have at least')) {
          errorMessage = 'Your file appears to be empty or has no data rows. Please ensure your file contains at least a header row and one data row.';
        } else if (error.message.includes('Excel must have at least')) {
          errorMessage = 'Your Excel file appears to be empty or has no data rows. Please ensure your file contains at least a header row and one data row.';
        } else if (error.message.includes('No valid employees to upload')) {
          errorMessage = 'All employees in this file have conflicts with existing employees. Please check for duplicate Employee IDs or emails.';
        } else if (error.message.includes('No valid employee data found')) {
          errorMessage = 'No valid employee data was found in your file. Please check that your data follows the required format and try again.';
        } else if (error.message.includes('DUPLICATE_EMAIL')) {
          errorMessage = 'One or more employees with the same email already exist in the system. Please check your file for duplicate emails or use the conflict resolution feature.';
        } else if (error.message.includes('DUPLICATE_EMPLOYEE_ID')) {
          errorMessage = 'One or more employees with the same Employee ID already exist in the system. Please check your file for duplicate Employee IDs.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setUploadMessage(errorMessage);
      setUploadProgress('');
      setProcessingSteps([]);
    }
  };

  const handleConflictResolution = async (resolutions: ConflictResolution[]) => {
  try {
    setUploadStatus('processing');
    setUploadMessage('Processing conflict resolutions...');
    setUploadProgress('Processing conflict resolutions...');
    setProcessingSteps(['Processing conflict resolutions...']);

    const employees = ExcelParser.excelRowsToEmployees(excelRows);

    // ✅ FIX: Update resolutions with proper project handling
    const updatedResolutions = resolutions.map((resolution, index) => {
      const conflict = conflicts[index];
      if (conflict && resolution.action === 'use_excel') {
        return {
          ...resolution,
          existingEmployeeId: conflict.existingEmployee.id,
          // ✅ Ensure project data is included in the resolution
          includeProjects: true
        };
      }
      return resolution;
    });

    setUploadProgress('Saving employees to database...');
    setProcessingSteps(['Processing conflict resolutions...', 'Saving employees to database...']);

    // ✅ FIX: Use the conflict resolution bulk upload function with project updates
    const saveResult = await bulkUploadEmployeesWithConflicts(employees, updatedResolutions, conflicts);

    // ✅ CRITICAL FIX: Handle case where all resolutions are "keep_existing"
    // Count how many employees were actually processed (where action is "use_excel")
    const processedEmployeesCount = resolutions.filter(resolution => 
      resolution.action === 'use_excel'
    ).length;

    // If no employees were processed (all "keep_existing"), still show success
    if (processedEmployeesCount === 0) {
      setUploadedCount(0);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      setUploadStatus('success');
      setUploadMessage('All conflicts resolved successfully. No new employees were added as you chose to keep existing data.');
      
      setUploadProgress('');
      setProcessingSteps([]);
      setShowConflictResolution(false);
      setConflicts([]);
      setExcelRows([]);
      return;
    }

    // If some employees were processed, check the save result
    if (!saveResult || (Array.isArray(saveResult) && saveResult.length === 0)) {
      throw new Error('Failed to save employees to database');
    }

    const savedCount = Array.isArray(saveResult) ? saveResult.length : 0;
    setUploadedCount(savedCount);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    setUploadStatus('success');
    setUploadMessage(`Successfully processed and saved ${savedCount} employees to database`);
    
    setUploadProgress('');
    setProcessingSteps([]);
    setShowConflictResolution(false);
    setConflicts([]);
    setExcelRows([]);
  } catch (error) {
    console.error('Conflict resolution error:', error);
    setUploadStatus('error');
    setUploadMessage('An error occurred while processing the conflict resolutions. Please check your data and try again.');
    setUploadProgress('');
    setProcessingSteps([]);
  }
};

  const handleConflictResolutionCancel = () => {
    setShowConflictResolution(false);
    setConflicts([]);
    setExcelRows([]);
    setUploadStatus('idle');
    setUploadMessage('');
  };

  const downloadTemplate = async () => {
    try {
      // Get all projects from all clients
      const allProjects = clientNames.flatMap(client => 
        getProjectsForClient(client).map(project => project.name)
      );

      // Convert dropdown options to the format expected by the template
      const dropdownOptions: { [key: string]: string[] } = {};
      Object.keys(options).forEach(key => {
        dropdownOptions[key] = options[key].map(option => option.optionValue);
      });

      const blob = await ExcelParser.generateTemplateXLSX(
        clientNames,
        allProjects,
        dropdownOptions
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating template:', error);
      // Fallback to default template if there's an error
      const blob = await ExcelParser.generateTemplateXLSX();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ✅ FIXED: Proper reset function that clears all state and file input
  const resetUpload = () => {
    // Reset all state
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadedCount(0);
    setUploadProgress('');
    setProcessingSteps([]);
    setValidationSummary(null);
    setShowValidationDetails(false);
    setConflicts([]);
    setExcelRows([]);
    setShowConflictResolution(false);
    setDragActive(false);
    
    // ✅ CRITICAL FIX: Properly reset the file input to accept same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Conflict Resolution Modal */}
      {showConflictResolution && (
        <ConflictResolutionModal
          conflicts={conflicts}
          onResolve={handleConflictResolution}
          onCancel={handleConflictResolutionCancel}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Employee Upload</h2>
          <p className="text-gray-600">
            Upload employee data in bulk using Excel files. Download the Excel template to get started.
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            <span>Download Template</span>
          </button>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive
              ? 'border-slate-400 bg-slate-50'
              : uploadStatus === 'error'
              ? 'border-rose-300 bg-rose-50'
              : uploadStatus === 'success'
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* ✅ FIXED: Input element with proper key to force re-render */}
          <input
            key={uploadStatus} // This forces re-render when status changes
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadStatus === 'processing'}
          />

          <div className="space-y-4">
            {uploadStatus === 'idle' && (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-xl font-semibold text-gray-900">
                    Drop your file here, or click to browse
                  </p>
                  <p className="text-gray-600 mt-2">
                    Supports Excel (.xlsx) files up to 10MB
                  </p>
                </div>
              </>
            )}

            {uploadStatus === 'processing' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-xl font-semibold text-gray-900">{uploadMessage}</p>
                {uploadProgress && (
                  <p className="text-sm text-gray-600 mt-2">{uploadProgress}</p>
                )}
                {processingSteps.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {processingSteps.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className={`w-2 h-2 rounded-full ${index === processingSteps.length - 1 ? 'bg-blue-600' : 'bg-green-500'}`}></div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {uploadStatus === 'success' && (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <div>
                  <p className="text-xl font-semibold text-green-900">{uploadMessage}</p>
                  <button
                    onClick={resetUpload}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Upload Another File
                  </button>
                </div>
              </>
            )}

            {uploadStatus === 'error' && (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
                <div>
                  <p className="text-xl font-semibold text-red-900">Upload Failed</p>
                  <p className="text-red-700 mt-2">{uploadMessage}</p>
                  <button
                    onClick={resetUpload}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {uploadStatus === 'success' && (
          <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h3 className="font-semibold text-emerald-800 mb-2">Upload Summary</h3>
            <ul className="text-emerald-700 space-y-1">
              <li>• {uploadedCount} employees processed and saved successfully</li>
              <li>• Data validation completed</li>
              <li>• All records are now available in the employee directory</li>
              <li>• Database updated successfully</li>
            </ul>
          </div>
        )}

        {validationSummary && uploadStatus === 'error' && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-yellow-800">Validation Summary</h3>
              <button
                onClick={() => setShowValidationDetails(!showValidationDetails)}
                className="text-sm text-yellow-600 hover:text-yellow-800 underline"
              >
                {showValidationDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            <div className="text-yellow-700 space-y-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Total Rows: {validationSummary.totalRows}</div>
                <div>Valid Rows: {validationSummary.validRows}</div>
                <div>Invalid Rows: {validationSummary.invalidRows}</div>
                <div>Duplicate IDs: {validationSummary.duplicateEmployeeIds}</div>
                <div>Duplicate Emails: {validationSummary.duplicateEmails}</div>
                <div>Missing Fields: {validationSummary.missingRequiredFields}</div>
                <div>Format Errors: {validationSummary.invalidFormats}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-slate-800 mb-2">File Format Requirements</h3>
          <ul className="text-slate-700 space-y-1 text-sm">
            <li>• First row must contain column headers</li>
            <li>• Required fields: Employee ID, Name, Email, Department, Designation</li>
            <li>• Date format: DD-MM-YYYY (e.g., 15-08-2024)</li>
            <li>• Skills should be separated by semicolons (;)</li>
            <li>• Phone numbers: Use only numbers, spaces, hyphens, parentheses, and plus signs</li>
            <li>• Project fields are optional - use for detailed project allocation</li>
            <li>• Allocation Percentage: 0-100 (default: 100 if not specified)</li>
            <li>• Download the template for dropdown options and examples</li>
          </ul>
        </div>
      </div>
    </div>
  );
};