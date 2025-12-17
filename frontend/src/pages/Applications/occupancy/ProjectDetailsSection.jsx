import React from 'react';
import { ProjectLocationSelector } from './AddressSelectors';

const ProjectDetailsSection = ({ formData, errors = {}, setFormData, handleProjectDetailsChange }) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">4. Project Details</h2>
      <p className="text-sm text-gray-500">Provide details about your project. We use this to verify the scope and usage for occupancy.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700">Project Name</label>
          <input required type="text" name="projectName" value={formData.projectDetails.projectName} onChange={handleProjectDetailsChange} className={`mt-1 p-2 rounded w-full border ${errors['projectDetails.projectName'] ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., ABC Residences Tower 1" />
          {errors['projectDetails.projectName'] && <p className="text-xs text-red-600 mt-1">{errors['projectDetails.projectName']}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Project Location</label>
          <input required type="text" name="projectLocation" value={formData.projectDetails.projectLocation} onChange={handleProjectDetailsChange} className={`mt-1 p-2 rounded w-full border ${errors['projectDetails.projectLocation'] ? 'border-red-500' : 'border-gray-300'}`} placeholder="Street, Barangay, City" />
          {errors['projectDetails.projectLocation'] && <p className="text-xs text-red-600 mt-1">{errors['projectDetails.projectLocation']}</p>}
          <ProjectLocationSelector value={formData.projectDetails.projectLocation} onChange={(val)=> setFormData(prev=>({...prev, projectDetails:{...prev.projectDetails, projectLocation: val}}))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Use / Character of Occupancy</label>
          <input required type="text" name="occupancyUse" value={formData.projectDetails.occupancyUse} onChange={handleProjectDetailsChange} className={`mt-1 p-2 rounded w-full border ${errors['projectDetails.occupancyUse'] ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., Residential Dwelling, Commercial, Educational" />
          {errors['projectDetails.occupancyUse'] && <p className="text-xs text-red-600 mt-1">{errors['projectDetails.occupancyUse']}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
          <input type="number" name="noStoreys" value={formData.projectDetails.noStoreys} onChange={handleProjectDetailsChange} className={`p-2 rounded border ${errors['projectDetails.noStoreys'] ? 'border-red-500' : 'border-gray-300'}`} placeholder="No. of Storeys" required />
          {errors['projectDetails.noStoreys'] && <p className="text-xs text-red-600 mt-1">{errors['projectDetails.noStoreys']}</p>}
          <input type="number" name="noUnits" value={formData.projectDetails.noUnits} onChange={handleProjectDetailsChange} className="p-2 rounded border border-gray-300" placeholder="No. of Units" />
          <input type="text" name="totalFloorArea" value={formData.projectDetails.totalFloorArea} onChange={handleProjectDetailsChange} className="p-2 rounded border border-gray-300" placeholder="Total Floor Area (m²)" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Date of Completion</label>
          <input required type="date" name="dateCompletion" value={formData.projectDetails.dateCompletion} onChange={handleProjectDetailsChange} className={`mt-1 p-2 rounded w-full border ${errors['projectDetails.dateCompletion'] ? 'border-red-500' : 'border-gray-300'}`} />
          {errors['projectDetails.dateCompletion'] && <p className="text-xs text-red-600 mt-1">{errors['projectDetails.dateCompletion']}</p>}
        </div>
      </div>
    </section>
  );
};

export default ProjectDetailsSection;
