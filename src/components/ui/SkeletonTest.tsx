import React from 'react';
import { SkeletonProjects } from './SkeletonProjects';
import { SkeletonProjectDetail } from './SkeletonProjectDetail';

export const SkeletonTest: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Skeleton Projects Test</h2>
        <SkeletonProjects clientCount={6} />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Skeleton Project Detail Test</h2>
        <SkeletonProjectDetail employeeCount={5} />
      </div>
    </div>
  );
};

export default SkeletonTest;