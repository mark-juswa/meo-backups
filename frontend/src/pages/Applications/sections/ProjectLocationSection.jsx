import React, { useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import FieldGroup from '../components/FieldGroup';
import FormField from '../components/FormField';
import { usePHAddress } from '../../../hooks/usePHAddress';

const ProjectLocationSection = ({ box1, setBox1, errors = {} }) => {
  const projectAddr = box1.location;
  const enterpriseAddr = box1.enterprise.address;

  // REGION STATE (frontend-only)
  const [projectRegion, setProjectRegion] = useState('');
  const [enterpriseRegion, setEnterpriseRegion] = useState('');

  const projectPH = usePHAddress(projectRegion, projectAddr.provinceCode, projectAddr.cityCode);
  const enterprisePH = usePHAddress(enterpriseRegion, enterpriseAddr.provinceCode, enterpriseAddr.cityCode);

  // 🔒 SAFE SETTERS (store NAMES only)
  const setProjectField = (field, value) => {
    setBox1(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const setEnterpriseField = (field, value) => {
    setBox1(prev => ({
      ...prev,
      enterprise: {
        ...prev.enterprise,
        address: { ...prev.enterprise.address, [field]: value }
      }
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Where Is Your Project?"
        description="Tell us the exact location of your construction project"
      />

      {/* PROPERTY DETAILS */}
      <FieldGroup title="Property Details (Optional)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Lot Number" value={projectAddr.lotNo}
            onChange={e => setProjectField('lotNo', e.target.value)} />
          <FormField label="Block Number" type="number" value={projectAddr.blkNo}
            onChange={e => setProjectField('blkNo', e.target.value)} />
          <FormField label="TCT / OCT No." type="number" value={projectAddr.tctNo}
            onChange={e => setProjectField('tctNo', e.target.value)} />
          <FormField label="Tax Declaration No." type="number" value={projectAddr.taxDecNo}
            onChange={e => setProjectField('taxDecNo', e.target.value)} />
        </div>
      </FieldGroup>

      {/* PROJECT ADDRESS */}
      <FieldGroup title="Project Address (Required)">
        <FormField
          label="Street Address"
          value={projectAddr.street}
          onChange={e => setProjectField('street', e.target.value)}
          required
          error={errors.loc_street}
        />

        {/* REGION */}
        <select
          value={projectRegion}
          onChange={e => {
            setProjectRegion(e.target.value);
            setProjectField('province', '');
            setProjectField('city', '');
            setProjectField('barangay', '');
          }}
        >
          <option value="">Select Region</option>
          {projectPH.regionList.map(r => (
            <option key={r.region_code} value={r.region_code}>
              {r.region_name}
            </option>
          ))}
        </select>

        {/* PROVINCE */}
        <select
          onChange={e => {
            const p = projectPH.provinceList.find(x => x.province_code === e.target.value);
            setProjectField('province', p?.province_name || '');
            setProjectField('city', '');
            setProjectField('barangay', '');
          }}
        >
          <option value="">Select Province</option>
          {projectPH.provinceList.map(p => (
            <option key={p.province_code} value={p.province_code}>
              {p.province_name}
            </option>
          ))}
        </select>

        {/* CITY */}
        <select
          onChange={e => {
            const c = projectPH.cityList.find(x => x.city_code === e.target.value);
            setProjectField('city', c?.city_name || '');
            setProjectField('barangay', '');
          }}
        >
          <option value="">Select City / Municipality</option>
          {projectPH.cityList.map(c => (
            <option key={c.city_code} value={c.city_code}>
              {c.city_name}
            </option>
          ))}
        </select>

        {/* BARANGAY */}
        <select
          onChange={e => {
            const b = projectPH.barangayList.find(x => x.brgy_code === e.target.value);
            setProjectField('barangay', b?.brgy_name || '');
          }}
        >
          <option value="">Select Barangay</option>
          {projectPH.barangayList.map(b => (
            <option key={b.brgy_code} value={b.brgy_code}>
              {b.brgy_name}
            </option>
          ))}
        </select>
      </FieldGroup>

      {/* ENTERPRISE ADDRESS (same logic) */}
      <FieldGroup title="Business / Enterprise Address">
        <FormField label="Street"
          value={enterpriseAddr.street}
          onChange={e => setEnterpriseField('street', e.target.value)} />

        <select
          value={enterpriseRegion}
          onChange={e => {
            setEnterpriseRegion(e.target.value);
            setEnterpriseField('province', '');
            setEnterpriseField('city', '');
            setEnterpriseField('barangay', '');
          }}
        >
          <option value="">Select Region</option>
          {enterprisePH.regionList.map(r => (
            <option key={r.region_code} value={r.region_code}>
              {r.region_name}
            </option>
          ))}
        </select>

        <select
          onChange={e => {
            const p = enterprisePH.provinceList.find(x => x.province_code === e.target.value);
            setEnterpriseField('province', p?.province_name || '');
          }}
        >
          <option value="">Select Province</option>
          {enterprisePH.provinceList.map(p => (
            <option key={p.province_code} value={p.province_code}>
              {p.province_name}
            </option>
          ))}
        </select>

        <select
          onChange={e => {
            const c = enterprisePH.cityList.find(x => x.city_code === e.target.value);
            setEnterpriseField('city', c?.city_name || '');
          }}
        >
          <option value="">Select City</option>
          {enterprisePH.cityList.map(c => (
            <option key={c.city_code} value={c.city_code}>
              {c.city_name}
            </option>
          ))}
        </select>

        <select
          onChange={e => {
            const b = enterprisePH.barangayList.find(x => x.brgy_code === e.target.value);
            setEnterpriseField('barangay', b?.brgy_name || '');
          }}
        >
          <option value="">Select Barangay</option>
          {enterprisePH.barangayList.map(b => (
            <option key={b.brgy_code} value={b.brgy_code}>
              {b.brgy_name}
            </option>
          ))}
        </select>
      </FieldGroup>
    </div>
  );
};

export default ProjectLocationSection;
