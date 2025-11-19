import React from "react";

interface SkeletonEmployeeHeaderProps {
  showBulkUpload?: boolean;
  showMassDelete?: boolean;
}

export const SkeletonEmployeeHeader: React.FC<SkeletonEmployeeHeaderProps> = ({
  showBulkUpload = true,
  showMassDelete = false,
}) => {
  return (
    <div className="p-4 border-b bg-white mt-1">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center w-full">
        {/* 🔍 Search Bar Skeleton */}
        <div className="relative flex-1 min-w-0">
          <div className="animate-pulse relative">
            {/* Input bar */}
            <div className="h-9 bg-gray-200 rounded-lg w-full"></div>
            {/* Icon placeholder */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>

        {/* 🧭 Filters Skeleton (Department, Client, Status, Mode) */}
        <div className="flex gap-2 min-w-0 flex-shrink-0 flex-wrap">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-9 w-[110px] bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* ⚙️ Action Buttons Skeleton */}
        <div className="flex gap-2 flex-shrink-0 items-center">
          {/* Column Toggle Button */}
          <div className="animate-pulse">
            <div className="h-9 w-9 lg:w-24 bg-gray-200 rounded-lg"></div>
          </div>

          {/* Kebab Menu Button */}
          <div className="animate-pulse">
            <div className="h-9 w-9 bg-gray-200 rounded-lg"></div>
          </div>

          {/* Mass Delete Button (if visible) */}
          {showMassDelete && (
            <div className="animate-pulse">
              <div className="h-9 w-16 bg-gray-200 rounded-lg"></div>
            </div>
          )}

          {/* Bulk Upload Button (if allowed) */}
          {showBulkUpload && (
            <div className="animate-pulse">
              <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
            </div>
          )}

          {/* Add Employee Button */}
          <div className="animate-pulse">
            <div className="h-9 w-28 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonEmployeeHeader;
