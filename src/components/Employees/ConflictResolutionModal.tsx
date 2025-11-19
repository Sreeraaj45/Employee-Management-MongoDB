import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, RefreshCw, User, Mail, Hash, Info, Loader2 } from 'lucide-react';
import { ConflictData, ConflictResolution } from '../../types';
import { ExcelParser } from '../../lib/excelParser';

interface ConflictResolutionModalProps {
  conflicts: ConflictData[];
  onResolve: (resolutions: ConflictResolution[]) => void;
  onCancel: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflicts,
  onResolve,
  onCancel
}) => {
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedCount, setResolvedCount] = useState(0);

  // Initialize resolutions with default actions - only for conflicts with actual differences
  React.useEffect(() => {
    const initialResolutions = new Map<string, ConflictResolution>();
    conflicts.forEach((conflict, index) => {
      const conflictId = `conflict-${index}`;
      // Only set resolution for conflicts that have real field differences
      if (hasRealFieldDifferences(conflict)) {
        initialResolutions.set(conflictId, {
          conflictId,
          action: 'keep_existing' // Default to keeping existing
        });
      }
    });
    setResolutions(initialResolutions);
  }, [conflicts]);

  const handleResolutionChange = (conflictId: string, action: ConflictResolution['action']) => {
    setResolutions(prev => {
      const newResolutions = new Map(prev);
      const currentResolution = newResolutions.get(conflictId);
      const newResolution = {
        conflictId,
        action,
        selectedFields: currentResolution?.selectedFields
      };
      newResolutions.set(conflictId, newResolution);
      return newResolutions;
    });
  };

  const toggleConflictExpansion = (conflictId: string) => {
    setExpandedConflicts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conflictId)) {
        newSet.delete(conflictId);
      } else {
        newSet.add(conflictId);
      }
      return newSet;
    });
  };

  const handleResolveAll = async () => {
    setIsResolving(true);
    
    // Simulate processing with progress
    const totalToProcess = getConflictsNeedingResolution();
    let processed = 0;
    
    const processBatch = () => {
      return new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          processed += Math.ceil(totalToProcess / 10);
          if (processed >= totalToProcess) {
            processed = totalToProcess;
            clearInterval(interval);
            resolve();
          }
          setResolvedCount(processed);
        }, 100);
      });
    };
    
    await processBatch();
    
    // For conflicts without differences, automatically set to 'keep_existing'
    const allResolutions: ConflictResolution[] = conflicts.map((conflict, index) => {
      const conflictId = `conflict-${index}`;
      const existingResolution = resolutions.get(conflictId);
      
      if (existingResolution) {
        return existingResolution;
      } else {
        // Auto-resolve identical data conflicts to 'keep_existing'
        return {
          conflictId,
          action: 'keep_existing'
        };
      }
    });
    
    onResolve(allResolutions);
  };

  const getConflictIcon = (conflictType: string) => {
    switch (conflictType) {
      case 'employee_id':
        return <Hash className="h-4 w-4 text-blue-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'both_id_and_email':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getConflictDescription = (conflictType: string) => {
    switch (conflictType) {
      case 'employee_id':
        return 'Employee ID already exists';
      case 'email':
        return 'Email address already exists';
      case 'both_id_and_email':
        return 'Both Employee ID and Email already exist (different employees)';
      default:
        return 'Conflict detected';
    }
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatFieldValue = (field: string, value: string) => {
    if (field === 'skills' && value) {
      return value.split(';').map(s => s.trim()).filter(s => s).join(', ');
    }
    if (field.includes('Date') && value) {
      return ExcelParser.formatDateToDDMMYYYY(value) || value;
    }
    if (field === 'ctc' && value) {
      return `₹${(parseFloat(value) / 1000).toFixed(0)}K`;
    }
    if (field === 'rate' && value) {
      return `₹${value}`;
    }
    return value || '-';
  };

  // Filter out ONLY employeeProjects from field differences since it's not in Excel
  // In ConflictResolutionModal component, update getFilteredFieldDifferences
const getFilteredFieldDifferences = (conflict: ConflictData) => {
  return conflict.fieldDifferences.filter(diff => {
    // Remove employeeProjects
    if (diff.field === 'employeeProjects') {
      return false;
    }
    
    // ✅ FILTER OUT project date differences with special values
    if (diff.field === 'projectStartDate' || diff.field === 'projectEndDate') {
      const isSpecialValue = (value: string) => {
        const lowerValue = String(value || '').toLowerCase();
        return lowerValue === 'na' || lowerValue === 'milestone' || lowerValue === 'sow';
      };
      
      const isEmptyValue = (value: string) => {
        return !value || String(value).trim() === '' || String(value).toLowerCase() === 'na';
      };
      
      const excelValue = String(diff.excelValue || '');
      const existingValue = String(diff.existingValue || '');
      
      // Filter out if Excel has special value and DB is empty/NA or vice versa
      if ((isSpecialValue(excelValue) && isEmptyValue(existingValue)) ||
          (isEmptyValue(excelValue) && isSpecialValue(existingValue)) ||
          (isSpecialValue(excelValue) && isSpecialValue(existingValue))) {
        return false;
      }
    }
    
    return true;
  });
};



  // Check if there are any REAL field differences (not just employeeProjects and special date values)
  // Check if there are any REAL field differences (not just employeeProjects and special date values)
const hasRealFieldDifferences = (conflict: ConflictData) => {
  const realDifferences = conflict.fieldDifferences.filter(diff => {
    // Skip employeeProjects as it's not in Excel
    if (diff.field === 'employeeProjects') {
      return false;
    }
    
    // ✅ SPECIAL HANDLING: Skip project conflicts when it's just default project differences
    if (diff.field === 'projects') {
      const existingValue = String(diff.existingValue || '');
      const excelValue = String(diff.excelValue || '');
      const clientName = conflict.existingEmployee.client;
      
      // Don't count as real difference if:
      // - Both values are empty
      // - One is a default project and the other is empty
      // - Both are default projects (even if formatted differently)
      const isDefaultProject = (value: string, client: string) => {
        if (!value || !client) return false;
        return value === client || 
               value === `${client} - Default Project` ||
               value.startsWith('__CLIENT_ONLY__');
      };
      
      const existingIsDefault = isDefaultProject(existingValue, clientName);
      const excelIsDefault = isDefaultProject(excelValue, clientName);
      
      if ((existingIsDefault && !excelValue) || 
          (!existingValue && excelIsDefault) ||
          (existingIsDefault && excelIsDefault)) {
        return false;
      }
    }
    
    // ✅ SPECIAL HANDLING: Skip project date differences when Excel has special values
    if (diff.field === 'projectStartDate' || diff.field === 'projectEndDate') {
      const isSpecialValue = (value: string) => {
        const lowerValue = String(value || '').toLowerCase();
        return lowerValue === 'na' || lowerValue === 'milestone' || lowerValue === 'sow';
      };
      
      const isEmptyValue = (value: string) => {
        return !value || String(value).trim() === '' || String(value).toLowerCase() === 'na';
      };
      
      const excelValue = String(diff.excelValue || '');
      const existingValue = String(diff.existingValue || '');
      
      // Don't count as real difference if:
      // - Excel has special value and DB is empty/NA
      // - Both are empty/special values
      if ((isSpecialValue(excelValue) && isEmptyValue(existingValue)) ||
          (isEmptyValue(excelValue) && isSpecialValue(existingValue)) ||
          (isSpecialValue(excelValue) && isSpecialValue(existingValue))) {
        return false;
      }
    }
    
    // For all other fields, check if values are actually different
    return diff.existingValue !== diff.excelValue;
  });
  
  return realDifferences.length > 0;
};

// Count conflicts that need resolution (have actual differences)
const getConflictsNeedingResolution = () => {
  return conflicts.filter(conflict => hasRealFieldDifferences(conflict)).length;
};

// Group conflicts by type for better organization
const conflictsWithDifferences = conflicts.filter(conflict => hasRealFieldDifferences(conflict));
const identicalConflicts = conflicts.filter(conflict => !hasRealFieldDifferences(conflict));

// Loading state component
if (isResolving) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Resolving Conflicts
            </h3>
            <p className="text-gray-600 mb-4">
              Processing {resolvedCount} of {getConflictsNeedingResolution()} conflicts...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${getConflictsNeedingResolution() > 0 ? (resolvedCount / getConflictsNeedingResolution()) * 100 : 100}%` 
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              This may take a few moments...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Reduced Size */}
        <div className="flex items-center justify-between p-5 border-b bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-800">
                Duplicate Employees Found
              </h2>
              <p className="text-red-600 text-sm mt-0.5">
                Please review the conflicts below
              </p>
            </div>
          </div>
          
          {/* Counts - Reduced Size */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">{conflicts.length}</div>
              <div className="text-xs font-medium text-red-600">Total Duplicates</div>
            </div>
            <div className="w-px h-8 bg-red-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{getConflictsNeedingResolution()}</div>
              <div className="text-xs font-medium text-blue-600">Need Resolution</div>
            </div>
            <div className="w-px h-8 bg-red-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{identicalConflicts.length}</div>
              <div className="text-xs font-medium text-green-600">Identical Data</div>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors ml-4"
          >
            <X className="h-5 w-5 text-red-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Conflicts with Differences */}
          {conflictsWithDifferences.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div>
                    <h3 className="text-base font-semibold text-orange-900">
                      Action Required
                    </h3>
                  </div>
                </div>
                <div className="text-orange-700 text-sm">
                  {conflictsWithDifferences.length} conflict{conflictsWithDifferences.length !== 1 ? 's' : ''} with data differences need your attention
                </div>
              </div>

              <div className="space-y-4">
                {conflictsWithDifferences.map((conflict, index) => {
                  const originalIndex = conflicts.indexOf(conflict);
                  const conflictId = `conflict-${originalIndex}`;
                  const resolution = resolutions.get(conflictId);
                  const isExpanded = expandedConflicts.has(conflictId);
                  const filteredDifferences = getFilteredFieldDifferences(conflict);
                  
                  return (
                    <div key={conflictId} className="border border-orange-300 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                      {/* Conflict Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getConflictIcon(conflict.conflictType)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {conflict.excelEmployee.name}
                              </h3>
                              <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-medium">
                                Row {conflict.rowNumber}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {getConflictDescription(conflict.conflictType)}
                            </p>
                            {filteredDifferences.length > 0 && (
                              <p className="text-xs text-orange-600 font-medium mt-1">
                                {filteredDifferences.length} field{filteredDifferences.length !== 1 ? 's' : ''} differ
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleConflictExpansion(conflictId)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 px-2 py-1.5 rounded transition-colors"
                        >
                          <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        </button>
                      </div>

                      {/* Quick Resolution Actions */}
                      <div className="mb-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResolutionChange(conflictId, 'keep_existing')}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded border transition-all text-sm ${
                              resolution?.action === 'keep_existing' 
                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span className="font-medium">Keep Existing</span>
                          </button>
                          
                          <button
                            onClick={() => handleResolutionChange(conflictId, 'use_excel')}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded border transition-all text-sm ${
                              resolution?.action === 'use_excel' 
                                ? 'bg-green-50 border-green-300 text-green-700 shadow-sm' 
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span className="font-medium">Update with new data</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="space-y-3 border-t pt-3">
                          {/* Employee Comparison */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <User className="h-3.5 w-3.5 text-blue-600" />
                                <span className="font-semibold text-blue-900 text-sm">Existing Employee</span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-blue-700 font-medium">ID:</span>
                                  <span className="text-blue-900">{conflict.existingEmployee.employeeId}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-blue-700 font-medium">Email:</span>
                                  <span className="text-blue-900">{conflict.existingEmployee.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-blue-700 font-medium">Department:</span>
                                  <span className="text-blue-900">{conflict.existingEmployee.department}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <RefreshCw className="h-3.5 w-3.5 text-green-600" />
                                <span className="font-semibold text-green-900 text-sm">Excel Data</span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-green-700 font-medium">ID:</span>
                                  <span className="text-green-900">{conflict.excelEmployee.employeeId}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-green-700 font-medium">Email:</span>
                                  <span className="text-green-900">{conflict.excelEmployee.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-green-700 font-medium">Department:</span>
                                  <span className="text-green-900">{conflict.excelEmployee.department}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Field Differences */}
                          {filteredDifferences.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Field Differences:</h4>
                              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="grid grid-cols-12 bg-gray-50 px-3 py-1.5 border-b border-gray-200 text-xs">
                                  <div className="col-span-4 font-medium text-gray-700">Field</div>
                                  <div className="col-span-4 font-medium text-gray-700">Existing Value</div>
                                  <div className="col-span-4 font-medium text-gray-700">Excel Value</div>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {filteredDifferences.map((diff, diffIndex) => (
                                    <div key={diffIndex} className="grid grid-cols-12 px-3 py-2 hover:bg-gray-50 transition-colors text-xs">
                                      <div className="col-span-4 font-medium text-gray-700">
                                        {formatFieldName(diff.field)}
                                      </div>
                                      <div className="col-span-4 text-red-600 font-medium">
                                        {formatFieldValue(diff.field, diff.existingValue)}
                                      </div>
                                      <div className="col-span-4 text-green-600 font-medium">
                                        {formatFieldValue(diff.field, diff.excelValue)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Identical Data Conflicts - Message moved to right */}
          {identicalConflicts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <h3 className="text-base font-semibold text-blue-900">
                    Auto-resolved Conflicts
                  </h3>
                </div>
                <div className="text-blue-700 text-sm">
                  {identicalConflicts.length} duplicate{identicalConflicts.length !== 1 ? 's' : ''} with identical data will be skipped automatically
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {identicalConflicts.map((conflict, index) => {
                    const originalIndex = conflicts.indexOf(conflict);
                    const conflictId = `conflict-${originalIndex}`;
                    
                    return (
                      <div key={conflictId} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-100 hover:border-blue-200 transition-colors">
                        <div className="flex items-center space-x-3">
                          {getConflictIcon(conflict.conflictType)}
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 text-sm">
                              {conflict.excelEmployee.name}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-600">
                              Row {conflict.rowNumber}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {getConflictDescription(conflict.conflictType)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">
                            Identical • Auto-skipped
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {getConflictsNeedingResolution() === 0 ? (
              <span className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Ready to continue - all conflicts are resolved</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">
                  <strong>{getConflictsNeedingResolution()} conflict{getConflictsNeedingResolution() !== 1 ? 's' : ''}</strong> need resolution before continuing
                </span>
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm"
            >
              Cancel Upload
            </button>
            <button
              onClick={handleResolveAll}
              disabled={getConflictsNeedingResolution() > 0 && conflictsWithDifferences.some((conflict, index) => !resolutions.get(`conflict-${conflicts.indexOf(conflict)}`))}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
            >
              <span>
                {getConflictsNeedingResolution() === 0 ? 'Continue Upload' : `Resolve ${getConflictsNeedingResolution()} Conflict${getConflictsNeedingResolution() !== 1 ? 's' : ''}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};