import React from 'react';
import SectionHeader from '../components/SectionHeader';
import FieldGroup from '../components/FieldGroup';
import FormField from '../components/FormField';
import { usePHAddress } from '../../../hooks/usePHAddress';


const ProjectLocationSection = ({ box1, setBox1, errors = {} }) => {

  // LOCATION HANDLERS 
  const handleLocationChange = (field, value) => {
    setBox1(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  // ENTERPRISE ADDRESS HANDLERS 
  const handleEnterpriseAddressChange = (field, value) => {
    setBox1(prev => ({
      ...prev,
      enterprise: {
        ...prev.enterprise,
        address: {
          ...prev.enterprise.address,
          [field]: value
        }
      }
    }));
  };

  /// PH ADDRESS HOOKS
  const projectAddr = box1.location;
  const enterpriseAddr = box1.enterprise.address;

  // Use Region dropdown purely for filtering; we do not persist region to box1 to avoid backend changes
  const [projectRegion, setProjectRegion] = React.useState('');
  const [enterpriseRegion, setEnterpriseRegion] = React.useState('');

  const projectPH = usePHAddress(projectRegion, projectAddr.province, projectAddr.city);
  const enterprisePH = usePHAddress(enterpriseRegion, enterpriseAddr.province, enterpriseAddr.city);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Where Is Your Project?"
        description="Tell us the exact location of your construction project"
        helpText="Accurate location information helps us process your permit faster and ensures proper site inspections."
      />

      {/* PROPERTY DETAILS */}
      <FieldGroup title="Property Details (Optional)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Lot Number" value={projectAddr.lotNo}
            onChange={e => handleLocationChange('lotNo', e.target.value)} />

          <FormField label="Block Number" type="number" value={projectAddr.blkNo}
            onChange={e => handleLocationChange('blkNo', e.target.value)} />

          <FormField label="TCT / OCT No." type="number" value={projectAddr.tctNo}
            onChange={e => handleLocationChange('tctNo', e.target.value)} />

          <FormField label="Tax Declaration No." type="number" value={projectAddr.taxDecNo}
            onChange={e => handleLocationChange('taxDecNo', e.target.value)} />
        </div>
      </FieldGroup>

      {/* PROJECT ADDRESS */}
      <FieldGroup title="Project Address (Required)">
        <FormField
          label="Street Address"
          value={projectAddr.street}
          onChange={e => handleLocationChange('street', e.target.value)}
          required
          error={errors.loc_street}
        />

        {/* REGION (for filtering only) */}
        <div>
          <label className="text-sm font-medium">Region (for filtering)</label>
          <select
            value={projectRegion}
            onChange={e => {
              const val = e.target.value;
              setProjectRegion(val);
              // Reset dependent fields when region changes
              handleLocationChange('province', '');
              handleLocationChange('city', '');
              handleLocationChange('barangay', '');
            }}
            className="w-full border rounded p-2"
          >
            <option value="">All Regions</option>
            {projectPH.regionList.map(r => (
              <option key={r.code || r.region_code || r.name} value={r.name || r.region || r.region_name}>{r.name || r.region || r.region_name}</option>
            ))}
          </select>
        </div>

        {/* PROVINCE */}
        <div>
          <label className="text-sm font-medium">Province</label>
          <select
            value={projectAddr.province || ''}
            onChange={e => {
              handleLocationChange('province', e.target.value);
              handleLocationChange('city', '');
              handleLocationChange('barangay', '');
            }}
            className="w-full border rounded p-2"
          >
            <option value="">Select Province</option>
            {projectPH.provinceList.map(p => (
              <option key={p.code || p.province_code || p.name} value={p.name || p.province || p.provinceName}>{p.name || p.province || p.provinceName}</option>
            ))}
          </select>
        </div>

        {/* CITY */}
        <div>
          <label className="text-sm font-medium">City / Municipality</label>
          <select
            value={projectAddr.city || ''}
            disabled={!projectAddr.province}
            onChange={e => {
              handleLocationChange('city', e.target.value);
              handleLocationChange('barangay', '');
            }}
            className="w-full border rounded p-2"
          >
            <option value="">Select City / Municipality</option>
            {projectPH.cityList.map(c => (
              <option key={c.code || c.city_code || c.name} value={c.name || c.city || c.cityName}>{c.name || c.city || c.cityName}</option>
            ))}
          </select>
        </div>

        {/* BARANGAY */}
        <div>
          <label className="text-sm font-medium">Barangay</label>
          <select
            value={projectAddr.barangay || ''}
            disabled={!projectAddr.city}
            onChange={e => handleLocationChange('barangay', e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select Barangay</option>
            {projectPH.barangayList.map(b => (
              <option key={b.code || b.brgy_code || b.name} value={b.name || b.brgy || b.brgyName}>{b.name || b.brgy || b.brgyName}</option>
            ))}
          </select>
        </div>
      </FieldGroup>

      {/* ENTERPRISE ADDRESS */}
      <FieldGroup title="Business / Enterprise Address">
        <FormField label="No." type="number"
          value={enterpriseAddr.no}
          onChange={e => handleEnterpriseAddressChange('no', e.target.value)} />

        <FormField label="Street"
          value={enterpriseAddr.street}
          onChange={e => handleEnterpriseAddressChange('street', e.target.value)} />

        {/* REGION (for filtering only) */}
        <select
          value={enterpriseRegion}
          onChange={e => {
            const val = e.target.value;
            setEnterpriseRegion(val);
            handleEnterpriseAddressChange('province', '');
            handleEnterpriseAddressChange('city', '');
            handleEnterpriseAddressChange('barangay', '');
          }}
          className="w-full border rounded p-2"
        >
          <option value="">All Regions</option>
          {enterprisePH.regionList.map(r => (
            <option key={r.code || r.region_code || r.name} value={r.name || r.region || r.region_name}>{r.name || r.region || r.region_name}</option>
          ))}
        </select>

        {/* PROVINCE */}
        <select
          value={enterpriseAddr.province || ''}
          onChange={e => {
            handleEnterpriseAddressChange('province', e.target.value);
            handleEnterpriseAddressChange('city', '');
            handleEnterpriseAddressChange('barangay', '');
          }}
          className="w-full border rounded p-2"
        >
          <option value="">Select Province</option>
          {enterprisePH.provinceList.map(p => (
            <option key={p.code || p.province_code || p.name} value={p.name || p.province || p.provinceName}>{p.name || p.province || p.provinceName}</option>
          ))}
        </select>

        {/* CITY */}
        <select
          value={enterpriseAddr.city || ''}
          disabled={!enterpriseAddr.province}
          onChange={e => {
            handleEnterpriseAddressChange('city', e.target.value);
            handleEnterpriseAddressChange('barangay', '');
          }}
          className="w-full border rounded p-2"
        >
          <option value="">Select City / Municipality</option>
          {enterprisePH.cityList.map(c => (
            <option key={c.code || c.city_code || c.name} value={c.name || c.city || c.cityName}>{c.name || c.city || c.cityName}</option>
          ))}
        </select>

        {/* BARANGAY */}
        <select
          value={enterpriseAddr.barangay || ''}
          disabled={!enterpriseAddr.city}
          onChange={e => handleEnterpriseAddressChange('barangay', e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">Select Barangay</option>
          {enterprisePH.barangayList.map(b => (
            <option key={b.code || b.brgy_code || b.name} value={b.name || b.brgy || b.brgyName}>{b.name || b.brgy || b.brgyName}</option>
          ))}
        </select>

        <FormField label="ZIP Code" type="number"
          value={enterpriseAddr.zip}
          onChange={e => handleEnterpriseAddressChange('zip', e.target.value)} />

        <FormField label="Telephone" type="number"
          value={enterpriseAddr.telNo}
          onChange={e => handleEnterpriseAddressChange('telNo', e.target.value)} />
      </FieldGroup>
    </div>
  );
};

export default ProjectLocationSection;
