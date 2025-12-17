import { regions, provinces, cities, barangays } from 'select-philippines-address';
import { useMemo } from 'react';

export const usePHAddress = (selectedRegion, selectedProvince, selectedCity) => {

  // REGIONS
  const regionList = useMemo(() => {
    return Array.isArray(regions) ? regions : [];
  }, []);

  // PROVINCES
  const provinceList = useMemo(() => {
    if (!selectedRegion) return [];
    return provinces.filter(p =>
      p.region === selectedRegion ||
      p.region_name === selectedRegion ||
      p.region_code === selectedRegion
    );
  }, [selectedRegion]);

  // CITIES / MUNICIPALITIES
  const cityList = useMemo(() => {
    if (!selectedProvince) return [];
    return cities.filter(c =>
      c.province === selectedProvince ||
      c.province_name === selectedProvince ||
      c.province_code === selectedProvince
    );
  }, [selectedProvince]);

  // BARANGAYS
  const barangayList = useMemo(() => {
    if (!selectedCity) return [];
    return barangays.filter(b =>
      b.city === selectedCity ||
      b.city_name === selectedCity ||
      b.city_code === selectedCity
    );
  }, [selectedCity]);

  return {
    regionList,
    provinceList,
    cityList,
    barangayList
  };
};
