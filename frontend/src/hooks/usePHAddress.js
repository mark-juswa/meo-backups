import { regions, provinces, cities, barangays } from 'select-philippines-address';
import { useEffect, useState } from 'react';

export const usePHAddress = (regionCode, provinceCode, cityCode) => {
  const [regionList, setRegionList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [barangayList, setBarangayList] = useState([]);

  // REGIONS
  useEffect(() => {
    regions().then(setRegionList);
  }, []);

  // PROVINCES
  useEffect(() => {
    if (!regionCode) {
      setProvinceList([]);
      return;
    }
    provinces(regionCode).then(setProvinceList);
  }, [regionCode]);

  // CITIES
  useEffect(() => {
    if (!provinceCode) {
      setCityList([]);
      return;
    }
    cities(provinceCode).then(setCityList);
  }, [provinceCode]);

  // BARANGAYS
  useEffect(() => {
    if (!cityCode) {
      setBarangayList([]);
      return;
    }
    barangays(cityCode).then(setBarangayList);
  }, [cityCode]);

  return {
    regionList,
    provinceList,
    cityList,
    barangayList,
  };
};
