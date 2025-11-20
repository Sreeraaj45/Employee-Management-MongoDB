/**
 * Format a date string or Date object to DD-MM-YYYY format
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string in DD-MM-YYYY format, or empty string if invalid
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    return '';
  }
}

/**
 * Format a date string or Date object to YYYY-MM-DD format (for input fields)
 * @param date - Date string or Date object
 * @returns Formatted date string in YYYY-MM-DD format, or empty string if invalid
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '';
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return '';
  }
}

/**
 * Parse a date string in DD-MM-YYYY format to Date object
 * @param dateStr - Date string in DD-MM-YYYY format
 * @returns Date object or null if invalid
 */
export function parseDateFromDDMMYYYY(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return null;
  
  return date;
}
