import React from 'react';
import SectionHeader from '../components/SectionHeader';
import FieldGroup from '../components/FieldGroup';
import FormField from '../components/FormField';

/**
 * Section B: Where Is Your Project?
 * Maps to: box1.location + box1.enterprise.address
 */
const ProjectLocationSection = ({ box1, setBox1, errors = {} }) => {
  
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setBox1(prev => ({
      ...prev,
      location: { ...prev.location, [name]: value }
    }));
  };

  const handleEnterpriseChange = (e) => {
    const { name, value } = e.target;
    setBox1(prev => ({
      ...prev,
      enterprise: { ...prev.enterprise, [name]: value }
    }));
  };

  const handleEnterpriseAddressChange = (e) => {
    const { name, value } = e.target;
    setBox1(prev => ({
      ...prev,
      enterprise: {
        ...prev.enterprise,
        address: { ...prev.enterprise.address, [name]: value }
      }
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Where Is Your Project?"
        description="Tell us the exact location of your construction project"
        helpText="Accurate location information helps us process your permit faster and ensures proper site inspections."
      />

      <FieldGroup title="Property Details (Optional)">
        <p className="text-sm text-gray-600 mb-3">
          Property documents help us verify ownership. If you have them, please provide:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Lot Number"
            name="lotNo"
            value={box1.location.lotNo}
            onChange={handleLocationChange}
            placeholder="e.g., Lot 5"
            helpText="From your property title or tax declaration"
          />
          
          <FormField
            label="Block Number"
            name="blkNo"
            type="number"
            value={box1.location.blkNo}
            onChange={handleLocationChange}
            placeholder="e.g., 10"
          />
          
          <FormField
            label="TCT/OCT Number"
            name="tctNo"
            type="number"
            value={box1.location.tctNo}
            onChange={handleLocationChange}
            placeholder="Transfer Certificate of Title number"
            helpText="Your land title number"
          />
          
          <FormField
            label="Tax Declaration Number"
            name="taxDecNo"
            type="number"
            value={box1.location.taxDecNo}
            onChange={handleLocationChange}
            placeholder="Tax Dec. No."
            helpText="From your property tax documents"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Project Address (Required)">
        <p className="text-sm text-gray-600 mb-3">
          Provide the complete address where construction will take place:
        </p>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Street Address"
            name="street"
            value={box1.location.street}
            onChange={handleLocationChange}
            required
            error={errors.loc_street}
            placeholder="e.g., 123 Rizal Street"
            helpText="Include house/building number and street name"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Barangay"
              name="barangay"
              value={box1.location.barangay}
              onChange={handleLocationChange}
              required
              error={errors.loc_barangay}
              placeholder="e.g., Barangay San Roque"
            />
            
            <FormField
              label="City / Municipality"
              name="city"
              value={box1.location.city}
              onChange={handleLocationChange}
              required
              error={errors.loc_city}
              placeholder="e.g., Quezon City"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Project Information">
        <FormField
          label="Project Title / Name"
          name="projectTitle"
          value={box1.enterprise.projectTitle}
          onChange={handleEnterpriseChange}
          placeholder="e.g., Dela Cruz Residence, ABC Commercial Building"
          helpText="Give your project a name for easy reference (optional)"
        />

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Business/Enterprise Address</p>
          <p className="text-xs text-gray-600 mb-3">
            If different from project location, provide your business/mailing address:
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FormField
                label="No."
                name="no"
                type="number"
                value={box1.enterprise.address.no}
                onChange={handleEnterpriseAddressChange}
                placeholder="123"
              />
              <FormField
                label="Street"
                name="street"
                value={box1.enterprise.address.street}
                onChange={handleEnterpriseAddressChange}
                placeholder="Main St."
                className="md:col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                label="Barangay"
                name="barangay"
                value={box1.enterprise.address.barangay}
                onChange={handleEnterpriseAddressChange}
                placeholder="Brgy. Name"
              />
              <FormField
                label="City"
                name="city"
                value={box1.enterprise.address.city}
                onChange={handleEnterpriseAddressChange}
                placeholder="City Name"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                label="ZIP Code"
                name="zip"
                type="number"
                value={box1.enterprise.address.zip}
                onChange={handleEnterpriseAddressChange}
                placeholder="1100"
              />
              <FormField
                label="Telephone"
                name="telNo"
                type="number"
                value={box1.enterprise.address.telNo}
                onChange={handleEnterpriseAddressChange}
                placeholder="(02) 123-4567"
              />
            </div>
          </div>
        </div>
      </FieldGroup>
    </div>
  );
};

export default ProjectLocationSection;
