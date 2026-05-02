import React from 'react';

const ReviewSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="flex items-center mt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded-full mx-0.5"></div>
            ))}
          </div>
          <div className="mt-2 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
        </div>
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
};

export default ReviewSkeleton;