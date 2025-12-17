import React, { useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import FieldGroup from '../components/FieldGroup';
import FormField from '../components/FormField';
import { usePHAddress } from '../../../hooks/usePHAddress';

const ProjectLocationSection = ({ box1, setBox1, errors = {} }) => {
  const projectAddr = box1.location;
  const enterpriseAddr = box1.enterprise.address;

  // REGION STATE 
  const [projectRegion, setProjectRegion] = useState('');
  const [projectProvinceCode, setProjectProvinceCode] = useState('');
  const [projectCityCode, setProjectCityCode] = useState('');
  const [projectBarangayCode, setProjectBarangayCode] = useState('');
  const [enterpriseRegion, setEnterpriseRegion] = useState('');
  const [enterpriseProvinceCode, setEnterpriseProvinceCode] = useState('');
  const [enterpriseCityCode, setEnterpriseCityCode] = useState('');
  const [enterpriseBarangayCode, setEnterpriseBarangayCode] = useState('');

  const projectPH = usePHAddress(projectRegion, projectProvinceCode, projectCityCode);
  const enterprisePH = usePHAddress(enterpriseRegion, enterpriseProvinceCode, enterpriseCityCode);

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
        <FormField label="Region">
        <select
          value={projectRegion}
          onChange={e => {
            const code = e.target.value;
            setProjectRegion(code);
            setProjectProvinceCode('');
            setProjectCityCode('');
            setProjectBarangayCode('');
            setProjectField('province', '');
            setProjectField('city', '');
            setProjectField('barangay', '');
          }}
          className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Region</option>
          {projectPH.regionList.map(r => (
            <option key={r.region_code} value={r.region_code}>
              {r.region_name}
            </option>
          ))}
        </select>
        </FormField>

        {/* PROVINCE */}
        <FormField label="Province">
        <select
          value={projectProvinceCode}
          disabled={!projectRegion}
          onChange={e => {
            const code = e.target.value;
            setProjectProvinceCode(code);
            const p = projectPH.provinceList.find(x => x.province_code === code);
            setProjectField('province', p?.province_name || '');
            setProjectCityCode('');
            setProjectBarangayCode('');
            setProjectField('city', '');
            setProjectField('barangay', '');
          }}
          className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">Select Province</option>
          {projectPH.provinceList.map(p => (
            <option key={p.province_code} value={p.province_code}>
              {p.province_name}
            </option>
          ))}
        </select>
        </FormField>

        {/* CITY */}
        <FormField label="City / Municipality">
        <select
          value={projectCityCode}
          disabled={!projectProvinceCode}
          onChange={e => {
            const code = e.target.value;
            setProjectCityCode(code);
            const c = projectPH.cityList.find(x => x.city_code === code);
            setProjectField('city', c?.city_name || '');
            setProjectBarangayCode('');
            setProjectField('barangay', '');
          }}
          className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">Select City / Municipality</option>
          {projectPH.cityList.map(c => (
            <option key={c.city_code} value={c.city_code}>
              {c.city_name}
            </option>
          ))}
        </select>
        </FormField>

        {/* BARANGAY */}
        <FormField label="Barangay">
        <select
          value={projectBarangayCode}
          disabled={!projectCityCode}
          onChange={e => {
            const code = e.target.value;
            setProjectBarangayCode(code);
            const b = projectPH.barangayList.find(x => x.brgy_code === code);
            setProjectField('barangay', b?.brgy_name || '');
          }}
          className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">Select Barangay</option>
          {projectPH.barangayList.map(b => (
            <option key={b.brgy_code} value={b.brgy_code}>
              {b.brgy_name}
            </option>
          ))}
        </select>
        </FormField>
      </FieldGroup>

      {/* ENTERPRISE ADDRESS (same logic) */}
      <FieldGroup title="Business / Enterprise Address">
        <FormField label="Street"
          value={enterpriseAddr.street}
          onChange={e => setEnterpriseField('street', e.target.value)} />

        <select
          value={enterpriseRegion}
          onChange={e => {
            const code = e.target.value;
            setEnterpriseRegion(code);
            setEnterpriseProvinceCode('');
            setEnterpriseCityCode('');
            setEnterpriseBarangayCode('');
            setEnterpriseField('province', '');
            setEnterpriseField('city', '');
            setEnterpriseField('barangay', '');
          }}
          className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Region</option>
          {enterprisePH.regionList.map(r => (
            <option key={r.region_code} value={r.region_code}>
              {r.region_name}
            </option>
          ))}
        </select>

        <select
          value={enterpriseProvinceCode}
          disabled={!enterpriseRegion}
          onChange={e => {
            const code = e.target.value;
            setEnterpriseProvinceCode(code);
            const p = enterprisePH.provinceList.find(x => x.province_code === code);
            setEnterpriseField('province', p?.province_name || '');
            setEnterpriseCityCode('');
            setEnterpriseBarangayCode('');
            setEnterpriseField('city', '');
            setEnterpriseField('barangay', '');
          }}
          className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">Select Province</option>
          {enterprisePH.provinceList.map(p => (
            <option key={p.province_code} value={p.province_code}>
              {p.province_name}
            </option>
          ))}
        </select>

        <select
          value={enterpriseCityCode}
          disabled={!enterpriseProvinceCode}
          onChange={e => {
            const code = e.target.value;
            setEnterpriseCityCode(code);
            const c = enterprisePH.cityList.find(x => x.city_code === code);
            setEnterpriseField('city', c?.city_name || '');
            setEnterpriseBarangayCode('');
            setEnterpriseField('barangay', '');
          }}
          className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">Select City</option>
          {enterprisePH.cityList.map(c => (
            <option key={c.city_code} value={c.city_code}>
              {c.city_name}
            </option>
          ))}
        </select>

        <select
          value={enterpriseBarangayCode}
          disabled={!enterpriseCityCode}
          onChange={e => {
            const code = e.target.value;
            setEnterpriseBarangayCode(code);
            const b = enterprisePH.barangayList.find(x => x.brgy_code === code);
            setEnterpriseField('barangay', b?.brgy_name || '');
          }}
          className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
