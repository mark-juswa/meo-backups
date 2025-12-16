import React from 'react';
import SectionHeader from '../components/SectionHeader';
import FieldGroup from '../components/FieldGroup';
import FormField from '../components/FormField';

/**
 * Section A: Who Are You?
 * Maps to: box1.owner + box1.enterprise.formOfOwnership
 */
const ApplicantSection = ({ box1, setBox1, errors = {} }) => {
  
  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setBox1(prev => ({
      ...prev,
      owner: { ...prev.owner, [name]: value }
    }));
  };

  const handleEnterpriseChange = (e) => {
    const { name, value } = e.target;
    setBox1(prev => ({
      ...prev,
      enterprise: { ...prev.enterprise, [name]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon="👤"
        title="Who Are You?"
        description="Let us know who is responsible for this construction project"
        helpText="We need your personal information to identify you as the applicant or property owner."
      />

      <FieldGroup title="Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Last Name"
            name="lastName"
            value={box1.owner.lastName}
            onChange={handleOwnerChange}
            required
            error={errors.owner_last_name}
            placeholder="Dela Cruz"
          />
          
          <FormField
            label="First Name"
            name="firstName"
            value={box1.owner.firstName}
            onChange={handleOwnerChange}
            required
            error={errors.owner_first_name}
            placeholder="Juan"
          />
          
          <FormField
            label="Middle Initial"
            name="middleInitial"
            value={box1.owner.middleInitial}
            onChange={handleOwnerChange}
            placeholder="P"
            className="md:col-span-1"
          />
        </div>

        <FormField
          label="Tax Identification Number (TIN)"
          name="tin"
          type="number"
          value={box1.owner.tin}
          onChange={handleOwnerChange}
          helpText="Your 12-digit TIN helps us verify your identity"
          placeholder="123456789012"
        />
      </FieldGroup>

      <FieldGroup title="Type of Applicant">
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Are you applying as an individual or as part of an organization?
          </p>
          
          <div className="space-y-2">
            <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="formOfOwnership"
                value="Individual"
                checked={box1.enterprise.formOfOwnership === 'Individual'}
                onChange={handleEnterpriseChange}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-800">Individual / Owner</div>
                <div className="text-sm text-gray-600">You personally own the property or are the primary applicant</div>
              </div>
            </label>

            <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="formOfOwnership"
                value="Corporation"
                checked={box1.enterprise.formOfOwnership === 'Corporation'}
                onChange={handleEnterpriseChange}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-800">Corporation</div>
                <div className="text-sm text-gray-600">A registered business corporation</div>
              </div>
            </label>

            <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="formOfOwnership"
                value="Partnership"
                checked={box1.enterprise.formOfOwnership === 'Partnership'}
                onChange={handleEnterpriseChange}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-800">Partnership</div>
                <div className="text-sm text-gray-600">A business partnership with multiple partners</div>
              </div>
            </label>

            <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="formOfOwnership"
                value="Cooperative"
                checked={box1.enterprise.formOfOwnership === 'Cooperative'}
                onChange={handleEnterpriseChange}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-800">Cooperative</div>
                <div className="text-sm text-gray-600">A registered cooperative organization</div>
              </div>
            </label>

            <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="formOfOwnership"
                value="Others"
                checked={box1.enterprise.formOfOwnership === 'Others'}
                onChange={handleEnterpriseChange}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-800">Other</div>
                <div className="text-sm text-gray-600">Specify your organization type</div>
              </div>
            </label>

            {box1.enterprise.formOfOwnership === 'Others' && (
              <FormField
                label="Please specify organization type"
                name="formOfOwnershipOther"
                value={box1.enterprise.formOfOwnershipOther}
                onChange={handleEnterpriseChange}
                required
                placeholder="e.g., Government Agency, NGO, Foundation"
                className="ml-8"
              />
            )}
          </div>
        </div>
      </FieldGroup>
    </div>
  );
};

export default ApplicantSection;
