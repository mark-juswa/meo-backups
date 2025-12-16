import React from 'react';

/**
 * Wrapper for grouping related form fields visually
 */
const FieldGroup = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 ${className}`}>
      {title && (
        <h4 className="text-lg font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">
          {title}
        </h4>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default FieldGroup;
