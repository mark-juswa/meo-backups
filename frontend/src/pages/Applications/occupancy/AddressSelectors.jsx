import React, { useState } from 'react';
import { usePHAddress } from '../../../hooks/usePHAddress';

export const OwnerAddressSelector = ({ value, onChange }) => {
  const st = (value || '').split(',')[0]?.trim() || '';
  const [regionCode, setRegionCode] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [barangayCode, setBarangayCode] = useState('');
  const { regionList, provinceList, cityList, barangayList } = usePHAddress(regionCode, provinceCode, cityCode);
  const compose = (brgyName, cityName, provName) => [st, brgyName, cityName, provName].filter(Boolean).join(', ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <select
        value={regionCode}
        onChange={(e)=>{ const code = e.target.value; setRegionCode(code); setProvinceCode(''); setCityCode(''); setBarangayCode(''); }}
        className="p-2 border rounded"
      >
        <option value="">Select Region</option>
        {regionList.map(r => (
          <option key={r.region_code} value={r.region_code}>{r.region_name}</option>
        ))}
      </select>
      <select
        value={provinceCode}
        disabled={!regionCode}
        onChange={(e)=>{
          const code = e.target.value; setProvinceCode(code); setCityCode(''); setBarangayCode('');
          const p = provinceList.find(x => x.province_code === code);
          onChange(compose('', '', p?.province_name || ''));
        }}
        className="p-2 border rounded disabled:bg-gray-100"
      >
        <option value="">Select Province</option>
        {provinceList.map(p => (
          <option key={p.province_code} value={p.province_code}>{p.province_name}</option>
        ))}
      </select>
      <select
        value={cityCode}
        disabled={!provinceCode}
        onChange={(e)=>{
          const code = e.target.value; setCityCode(code); setBarangayCode('');
          const c = cityList.find(x => x.city_code === code);
          const p = provinceList.find(x => x.province_code === provinceCode);
          onChange(compose('', c?.city_name || '', p?.province_name || ''));
        }}
        className="p-2 border rounded disabled:bg-gray-100"
      >
        <option value="">Select City / Municipality</option>
        {cityList.map(c => (
          <option key={c.city_code} value={c.city_code}>{c.city_name}</option>
        ))}
      </select>
      <select
        value={barangayCode}
        disabled={!cityCode}
        onChange={(e)=>{
          const code = e.target.value; setBarangayCode(code);
          const b = barangayList.find(x => x.brgy_code === code);
          const c = cityList.find(x => x.city_code === cityCode);
          const p = provinceList.find(x => x.province_code === provinceCode);
          onChange(compose(b?.brgy_name || '', c?.city_name || '', p?.province_name || ''));
        }}
        className="p-2 border rounded disabled:bg-gray-100"
      >
        <option value="">Select Barangay</option>
        {barangayList.map(b => (
          <option key={b.brgy_code} value={b.brgy_code}>{b.brgy_name}</option>
        ))}
      </select>
    </div>
  );
};

export const ProjectLocationSelector = ({ value, onChange }) => {
  const st = (value || '').split(',')[0]?.trim() || '';
  const [regionCode, setRegionCode] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [barangayCode, setBarangayCode] = useState('');
  const { regionList, provinceList, cityList, barangayList } = usePHAddress(regionCode, provinceCode, cityCode);
  const compose = (brgyName, cityName, provName) => [st, brgyName, cityName, provName].filter(Boolean).join(', ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
      <select
        value={regionCode}
        onChange={(e)=>{ const code = e.target.value; setRegionCode(code); setProvinceCode(''); setCityCode(''); setBarangayCode(''); }}
        className="p-2 border rounded"
      >
        <option value="">Region (optional)</option>
        {regionList.map(r => (
          <option key={r.region_code} value={r.region_code}>{r.region_name}</option>
        ))}
      </select>
      <select
        value={provinceCode}
        disabled={!regionCode}
        onChange={(e)=>{
          const code = e.target.value; setProvinceCode(code); setCityCode(''); setBarangayCode('');
          const p = provinceList.find(x => x.province_code === code);
          onChange(compose('', '', p?.province_name || ''));
        }}
        className="p-2 border rounded disabled:bg-gray-100"
      >
        <option value="">Province</option>
        {provinceList.map(p => (
          <option key={p.province_code} value={p.province_code}>{p.province_name}</option>
        ))}
      </select>
      <select
        value={cityCode}
        disabled={!provinceCode}
        onChange={(e)=>{
          const code = e.target.value; setCityCode(code); setBarangayCode('');
          const c = cityList.find(x => x.city_code === code);
          const p = provinceList.find(x => x.province_code === provinceCode);
          onChange(compose('', c?.city_name || '', p?.province_name || ''));
        }}
        className="p-2 border rounded disabled:bg-gray-100"
      >
        <option value="">City / Municipality</option>
        {cityList.map(c => (
          <option key={c.city_code} value={c.city_code}>{c.city_name}</option>
        ))}
      </select>
      <select
        value={barangayCode}
        disabled={!cityCode}
        onChange={(e)=>{
          const code = e.target.value; setBarangayCode(code);
          const b = barangayList.find(x => x.brgy_code === code);
          const c = cityList.find(x => x.city_code === cityCode);
          const p = provinceList.find(x => x.province_code === provinceCode);
          onChange(compose(b?.brgy_name || '', c?.city_name || '', p?.province_name || ''));
        }}
        className="p-2 border rounded disabled:bg-gray-100"
      >
        <option value="">Barangay</option>
        {barangayList.map(b => (
          <option key={b.brgy_code} value={b.brgy_code}>{b.brgy_name}</option>
        ))}
      </select>
    </div>
  );
};
