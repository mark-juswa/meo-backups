import React from 'react';

/**
 * Reusable section header component for task-oriented sections
 */
const SectionHeader = ({ icon, title, description, helpText }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-gray-600 mb-2">{description}</p>
      )}
      {helpText && (
        <div className="bg-blue-50 border-blue-400 p-3 rounded">
          <p className="text-sm text-blue-800">{helpText}</p>
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
