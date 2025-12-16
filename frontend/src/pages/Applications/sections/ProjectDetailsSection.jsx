import React from 'react';
import SectionHeader from '../components/SectionHeader';
import FieldGroup from '../components/FieldGroup';
import FormField from '../components/FormField';

/**
 * Section E: Project Size & Timeline
 * Maps to: box1.projectDetails
 */
const ProjectDetailsSection = ({ box1, setBox1, errors = {} }) => {
  
  const handleProjectDetailsChange = (e) => {
    const { name, value } = e.target;
    setBox1(prev => ({
      ...prev,
      projectDetails: { ...prev.projectDetails, [name]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Size & Timeline"
        description="Tell us about the scale and schedule of your construction project"
        helpText="This information helps us estimate permit fees and plan inspection schedules. Don't worry - you can update dates later if your schedule changes."
      />

      <FieldGroup title="Construction Cost">
        <FormField
          label="Estimated Total Cost"
          name="totalEstimatedCost"
          type="number"
          value={box1.projectDetails.totalEstimatedCost}
          onChange={handleProjectDetailsChange}
          required
          error={errors.total_estimated_cost}
          placeholder="500000"
          helpText="Include all costs: materials, labor, equipment, and permits (in Philippine Pesos ₱)"
        >
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₱</span>
            <input
              type="number"
              name="totalEstimatedCost"
              value={box1.projectDetails.totalEstimatedCost || ''}
              onChange={handleProjectDetailsChange}
              placeholder="500,000.00"
              className={`mt-1 block w-full pl-8 pr-3 py-2 text-sm sm:text-base rounded-md shadow-sm border 
                ${errors.total_estimated_cost ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
              `}
            />
          </div>
        </FormField>
      </FieldGroup>

      <FieldGroup title="Building Measurements">
        <p className="text-sm text-gray-600 mb-3">
          Provide the size of your building and property:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Total Floor Area"
            name="totalFloorArea"
            type="number"
            value={box1.projectDetails.totalFloorArea}
            onChange={handleProjectDetailsChange}
            placeholder="120"
            helpText="Square meters (m²) of all floors combined"
          />
          
          <FormField
            label="Lot Area"
            name="lotArea"
            type="number"
            value={box1.projectDetails.lotArea}
            onChange={handleProjectDetailsChange}
            placeholder="200"
            helpText="Square meters (m²) of the property"
          />
          
          <FormField
            label="Number of Units"
            name="numberOfUnits"
            type="number"
            value={box1.projectDetails.numberOfUnits}
            onChange={handleProjectDetailsChange}
            placeholder="1"
            helpText="Residential units, shops, or spaces"
          />
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg mt-3">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Floor area includes all levels. For a 2-story house with 60m² per floor, total floor area = 120m².
          </p>
        </div>
      </FieldGroup>

      <FieldGroup title="Construction Timeline">
        <p className="text-sm text-gray-600 mb-3">
          When do you plan to start and finish construction?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Proposed Start Date"
            name="proposedConstruction"
            type="date"
            value={box1.projectDetails.proposedConstruction}
            onChange={handleProjectDetailsChange}
            helpText="Estimated date when construction begins"
          />
          
          <FormField
            label="Expected Completion Date"
            name="expectedCompletion"
            type="date"
            value={box1.projectDetails.expectedCompletion}
            onChange={handleProjectDetailsChange}
            helpText="Estimated date when construction finishes"
          />
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg mt-3">
          <p className="text-xs text-yellow-800">
            <strong>💡 Tip:</strong> These dates are estimates. If your schedule changes during construction, you can request an extension.
          </p>
        </div>
      </FieldGroup>
    </div>
  );
};

export default ProjectDetailsSection;
