import { regions, provinces, cities, barangays } from 'select-philippines-address';
import { useEffect, useState } from 'react';

export const usePHAddress = (regionCode, provinceCode, cityCode) => {
  const [regionList, setRegionList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [barangayList, setBarangayList] = useState([]);

  // REGIONS
  useEffect(() => {
    regions()
      .then((data) => {
        setRegionList(Array.isArray(data) ? data : []);
      })
      .catch(() => setRegionList([]));
  }, []);

  // PROVINCES
  useEffect(() => {
    if (!regionCode) {
      setProvinceList([]);
      return;
    }
    provinces(regionCode)
      .then((data) => {
        setProvinceList(Array.isArray(data) ? data : []);
      })
      .catch(() => setProvinceList([]));
  }, [regionCode]);

  // CITIES
  useEffect(() => {
    if (!provinceCode) {
      setCityList([]);
      return;
    }
    cities(provinceCode)
      .then((data) => {
        setCityList(Array.isArray(data) ? data : []);
      })
      .catch(() => setCityList([]));
  }, [provinceCode]);

  // BARANGAYS
  useEffect(() => {
    if (!cityCode) {
      setBarangayList([]);
      return;
    }
    barangays(cityCode)
      .then((data) => {
        setBarangayList(Array.isArray(data) ? data : []);
      })
      .catch(() => setBarangayList([]));
  }, [cityCode]);

  return {
    regionList,
    provinceList,
    cityList,
    barangayList,
  };
};
