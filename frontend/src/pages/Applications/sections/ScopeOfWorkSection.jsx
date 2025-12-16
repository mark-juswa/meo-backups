import React from 'react';
import SectionHeader from '../components/SectionHeader';
import FieldGroup from '../components/FieldGroup';

/**
 * Section C: What Kind of Work Are You Doing?
 * Maps to: box1.scopeOfWork (array)
 */
const ScopeOfWorkSection = ({ box1, setBox1, errors = {} }) => {
  
  const handleScopeChange = (e) => {
    const { value, checked } = e.target;
    setBox1(prev => {
      const current = prev.scopeOfWork || [];
      if (checked) {
        return { ...prev, scopeOfWork: [...current, value] };
      } else {
        return { ...prev, scopeOfWork: current.filter(item => item !== value) };
      }
    });
  };

  const scopeOptions = {
    primary: [
      { value: 'new', label: 'New Building Construction', description: 'Building something brand new from the ground up' },
      { value: 'addition', label: 'Addition / Expansion', description: 'Adding to an existing structure (new rooms, floors, wings)' },
      { value: 'renovation', label: 'Major Renovation', description: 'Significant changes to existing structure' }
    ],
    structural: [
      { value: 'alteration', label: 'Alteration', description: 'Changing or modifying existing parts of the building' },
      { value: 'repair', label: 'Repair', description: 'Fixing or restoring damaged parts to original condition' },
      { value: 'conversion', label: 'Conversion', description: 'Changing the building\'s use or purpose' }
    ],
    other: [
      { value: 'erection', label: 'Erection', description: 'Installing or assembling structures' },
      { value: 'moving', label: 'Moving', description: 'Relocating an existing structure' },
      { value: 'raising', label: 'Raising', description: 'Elevating a building to a higher level' },
      { value: 'demolition', label: 'Demolition', description: 'Tearing down a structure' },
      { value: 'accessory', label: 'Accessory Structure', description: 'Garage, shed, fence, or similar structure' }
    ]
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon="🏗️"
        title="What Kind of Work Are You Doing?"
        description="Select all types of construction work that apply to your project"
        helpText="You can select multiple options if your project involves different types of work. For example, you might be doing both 'Addition' and 'Renovation'."
      />

      {errors.scope && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
          <p className="text-sm text-red-800">{errors.scope}</p>
        </div>
      )}

      <FieldGroup title="🏗️ Primary Construction Work">
        <p className="text-sm text-gray-600 mb-3">
          Select the main type of construction:
        </p>
        <div className="space-y-2">
          {scopeOptions.primary.map(option => (
            <label 
              key={option.value}
              className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
            >
              <input
                type="checkbox"
                value={option.value}
                checked={box1.scopeOfWork.includes(option.value)}
                onChange={handleScopeChange}
                className="mt-1 mr-3 rounded text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="🔧 Structural Changes">
        <p className="text-sm text-gray-600 mb-3">
          Making changes to an existing building? Select what applies:
        </p>
        <div className="space-y-2">
          {scopeOptions.structural.map(option => (
            <label 
              key={option.value}
              className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
            >
              <input
                type="checkbox"
                value={option.value}
                checked={box1.scopeOfWork.includes(option.value)}
                onChange={handleScopeChange}
                className="mt-1 mr-3 rounded text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="📦 Other Work Types">
        <p className="text-sm text-gray-600 mb-3">
          Additional types of construction work:
        </p>
        <div className="space-y-2">
          {scopeOptions.other.map(option => (
            <label 
              key={option.value}
              className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
            >
              <input
                type="checkbox"
                value={option.value}
                checked={box1.scopeOfWork.includes(option.value)}
                onChange={handleScopeChange}
                className="mt-1 mr-3 rounded text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </FieldGroup>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> The type of work you select determines which building codes and inspection requirements apply to your project.
        </p>
      </div>
    </div>
  );
};

export default ScopeOfWorkSection;
