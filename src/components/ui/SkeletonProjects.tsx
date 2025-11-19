import React, { useState, useEffect } from 'react';

interface SkeletonProjectsProps {
  showActions?: boolean;
  clientCount?: number;
}

export const SkeletonProjects: React.FC<SkeletonProjectsProps> = ({
  showActions = true,
  clientCount
}) => {
  const [calculatedCount, setCalculatedCount] = useState(6);

  useEffect(() => {
    const calculateCardCount = () => {
      // If clientCount is provided, use it
      if (clientCount) return clientCount;
      
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Approximate height of each skeleton card (in pixels)
      const cardHeight = 220; 
      // Cards needed to fill viewport height
      const cardsPerViewport = Math.ceil(viewportHeight / cardHeight);
      
      // Determine columns based on breakpoints (matching your grid)
      let columns = 1; // mobile: grid-cols-1
      if (viewportWidth >= 768) columns = 2; // md:grid-cols-2
      if (viewportWidth >= 1024) columns = 3; // lg:grid-cols-3
      
      // Calculate total cards needed to fill the screen
      const totalCards = cardsPerViewport * columns;
      
      // Return at least 6 cards, but enough to fill viewport
      return Math.max(6, totalCards + 2); // Add buffer for better coverage
    };

    setCalculatedCount(calculateCardCount());
    
    const handleResize = () => {
      setCalculatedCount(calculateCardCount());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clientCount]);

  return (
    <div className="space-y-6">
      {/* Actions Skeleton - Updated to match actual layout */}
      {showActions && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            {/* Search Bar Skeleton - Left side */}
            <div className="relative flex-1 min-w-0">
              <div className="animate-pulse">
                <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Refresh Button Skeleton */}
            <div className="animate-pulse">
              <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Stats Skeleton - Middle */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <div className="animate-pulse">
                <div className="h-10 w-20 bg-blue-100 rounded-lg"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-10 w-20 bg-emerald-100 rounded-lg"></div>
              </div>
            </div>

            {/* Action Buttons Skeleton - Right side */}
            <div className="flex gap-2 flex-shrink-0">
              <div className="animate-pulse">
                <div className="h-10 w-24 bg-blue-200 rounded-lg"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-10 w-24 bg-emerald-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clients Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: calculatedCount }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200">
            {/* Client Header - Clickable Area */}
            <div className="w-full p-4 border-b flex items-center justify-between hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
                {/* Client Icon */}
                <div className="animate-pulse">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-slate-400 to-blue-400 flex-shrink-0">
                    <div className="h-4 w-4 bg-white rounded"></div>
                  </div>
                </div>
                
                {/* Client Info */}
                <div className="min-w-0 flex-1">
                  <div className="animate-pulse">
                    <div className="h-4 w-32 bg-gray-300 rounded mb-1"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              
              {/* Employee Count */}
              <div className="flex items-center gap-1.5">
                <div className="animate-pulse">
                  <div className="h-4 w-4 bg-gray-300 rounded"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 w-6 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
            
            {/* Projects List */}
            <div className="divide-y">
              {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, projectIndex) => (
                <div key={projectIndex} className="p-3 hover:bg-slate-50 flex items-center justify-between group relative transition-colors duration-150">
                  <div className="flex-1 text-left flex items-center gap-2">
                    {/* Project Icon */}
                    <div className="animate-pulse">
                      <div className="p-1.5 rounded-md bg-slate-200">
                        <div className="h-3.5 w-3.5 bg-slate-300 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Project Info */}
                    <div className="min-w-0">
                      <div className="animate-pulse">
                        <div className="h-4 w-24 bg-gray-300 rounded mb-1"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Employee Count */}
                    <div className="flex items-center gap-1 text-xs text-gray-700">
                      <div className="animate-pulse">
                        <div className="h-3.5 w-3.5 bg-gray-300 rounded"></div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-3 w-4 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Project Menu Button */}
                    <div className="relative">
                      <div className="animate-pulse">
                        <div className="p-1.5 hover:bg-gray-200 rounded-lg transition-all duration-200 opacity-80 hover:opacity-100">
                          <div className="h-3.5 w-3.5 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Empty State for projects */}
              {Math.random() > 0.7 && (
                <div className="p-3 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-pulse">
                      <div className="h-3.5 w-3.5 bg-gray-300 rounded"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-3 w-16 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonProjects;