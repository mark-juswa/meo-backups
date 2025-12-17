import React from 'react';

const PermitInformationSection = ({ formData, handleBuildingPermitRefChange, handlePermitInfoChange }) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">1. Permit Information</h2>
      <p className="text-sm text-gray-500">We’ll verify your building permit and fire safety details. These help us confirm your project is eligible for occupancy.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Building Permit Reference Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.buildingPermitReferenceNo}
            onChange={handleBuildingPermitRefChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
            placeholder="e.g., BP-2024-000123"
            required
          />
          <p className="text-xs text-gray-500 mt-1">This must match the reference number from your approved Building Permit.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Issued (Building Permit)</label>
          <input type="date" name="buildingPermitDate" value={formData.permitInfo.buildingPermitDate} onChange={handlePermitInfoChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">FSEC No.</label>
          <input type="text" name="fsecNo" value={formData.permitInfo.fsecNo} onChange={handlePermitInfoChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg" placeholder="e.g., FSEC-12345" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Issued (FSEC)</label>
          <input type="date" name="fsecDate" value={formData.permitInfo.fsecDate} onChange={handlePermitInfoChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
      </div>
    </section>
  );
};

export default PermitInformationSection;
