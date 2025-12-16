import React from 'react';
import SectionHeader from '../components/SectionHeader';
import FieldGroup from '../components/FieldGroup';
import FormField from '../components/FormField';

/**
 * Section D: How Will the Building Be Used?
 * Maps to: box1.occupancy.group + box1.occupancy.classified
 */
const OccupancySection = ({ box1, setBox1, errors = {} }) => {
  
  const handleOccupancyChange = (e) => {
    const { name, value } = e.target;
    setBox1(prev => ({
      ...prev,
      occupancy: { ...prev.occupancy, [name]: value }
    }));
  };

  const occupancyGroups = [
    {
      category: '🏠 RESIDENTIAL & HOUSING',
      options: [
        { value: 'group_a', label: 'Group A: Residential Dwelling', description: 'Single-family homes, multi-family homes, apartments, condominiums' },
        { value: 'group_b', label: 'Group B: Residential Hotel/Transient', description: 'Hotels, motels, boarding houses, dormitories' }
      ]
    },
    {
      category: '🏫 COMMUNITY & PUBLIC SERVICES',
      options: [
        { value: 'group_c', label: 'Group C: Educational', description: 'Schools, colleges, universities, daycare centers, training facilities' },
        { value: 'group_d', label: 'Group D: Institutional', description: 'Hospitals, nursing homes, jails, rehabilitation centers' }
      ]
    },
    {
      category: '🏢 BUSINESS & COMMERCE',
      options: [
        { value: 'group_e', label: 'Group E: Commercial/Business', description: 'Offices, shops, restaurants, malls, markets, showrooms' },
        { value: 'group_f', label: 'Group F: Industrial/Manufacturing', description: 'Factories, warehouses, assembly plants, processing facilities' }
      ]
    },
    {
      category: '⚠️ SPECIALIZED FACILITIES',
      options: [
        { value: 'group_g', label: 'Group G: Hazardous Operations', description: 'Facilities handling flammable, combustible, or dangerous materials' },
        { value: 'group_h', label: 'Group H: Assembly (< 1000 capacity)', description: 'Churches, theaters, small gyms, community halls, restaurants with entertainment' },
        { value: 'group_i', label: 'Group I: Assembly (≥ 1000 capacity)', description: 'Large arenas, convention centers, stadiums, auditoriums' },
        { value: 'group_j', label: 'Group J: Agricultural', description: 'Barns, silos, farm structures, livestock facilities' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon="🏢"
        title="How Will the Building Be Used?"
        description="Select the primary purpose or use of your building"
        helpText="This classification determines the safety requirements, building codes, and inspection procedures for your project. Select the option that best describes the main use of your building."
      />

      {errors.occupancy && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
          <p className="text-sm text-red-800">{errors.occupancy}</p>
        </div>
      )}

      {occupancyGroups.map((category, idx) => (
        <FieldGroup key={idx} title={category.category}>
          <div className="space-y-2">
            {category.options.map(option => (
              <label 
                key={option.value}
                className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
              >
                <input
                  type="radio"
                  name="group"
                  value={option.value}
                  checked={box1.occupancy.group === option.value}
                  onChange={handleOccupancyChange}
                  className="mt-1 mr-3 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </FieldGroup>
      ))}

      <FieldGroup title="Other Occupancy Type">
        <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
          <input
            type="radio"
            name="group"
            value="other"
            checked={box1.occupancy.group === 'other'}
            onChange={handleOccupancyChange}
            className="mt-1 mr-3 text-blue-600"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-800">📝 Other (Please Specify)</div>
            <div className="text-sm text-gray-600">If your building use doesn't fit the categories above</div>
          </div>
        </label>

        <FormField
          label="Describe the Building Use"
          name="classified"
          value={box1.occupancy.classified}
          onChange={handleOccupancyChange}
          placeholder="e.g., Mixed-use (residential and commercial), Special purpose facility"
          helpText="Provide details about how the building will be used, especially if you selected 'Other' above or need to clarify the occupancy type"
        />
      </FieldGroup>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <p className="text-sm text-yellow-800">
          <strong>💡 Tip:</strong> If your building has multiple uses (e.g., ground floor shop with residential units above), select the <strong>primary</strong> use and describe the mixed-use nature in the field above.
        </p>
      </div>
    </div>
  );
};

export default OccupancySection;
