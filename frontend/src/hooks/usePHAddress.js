import { regions, provinces, cities, barangays } from 'select-philippines-address';
import { useMemo } from 'react';

// Hook provides cascading Philippine address data with optional Region filter
// Signature: usePHAddress(selectedRegion, selectedProvince, selectedCity)
export const usePHAddress = (selectedRegion, selectedProvince, selectedCity) => {
  const regionList = useMemo(() => regions || [], []);

  const provinceList = useMemo(() => {
    if (!selectedRegion) return provinces || [];
    return (provinces || []).filter(p => p.region === selectedRegion || p.regionName === selectedRegion || p.region_code === selectedRegion);
  }, [selectedRegion]);

  const cityList = useMemo(() => {
    if (!selectedProvince) return [];
    return (cities || []).filter(c => c.province === selectedProvince || c.provinceName === selectedProvince || c.province_code === selectedProvince);
  }, [selectedProvince]);

  const barangayList = useMemo(() => {
    if (!selectedCity) return [];
    return (barangays || []).filter(b => b.city === selectedCity || b.cityName === selectedCity || b.city_code === selectedCity);
  }, [selectedCity]);

  return {
    regionList,
    provinceList,
    cityList,
    barangayList
  };
};
