import React from 'react';

export const SkeletonPagination: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Left side - Showing text */}
      <div className="animate-pulse">
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>
      
      {/* Right side - Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* Previous button */}
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* Page info */}
        <div className="animate-pulse">
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        
        {/* Next button */}
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonPagination;