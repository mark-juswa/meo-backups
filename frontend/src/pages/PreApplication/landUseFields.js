// Shared field definitions for Land Use / Zoning pre-application OCR assist

export const LAND_USE_FIELDS = [
  { key: 'applicantName', label: 'Applicant Name' },
  { key: 'projectLocation', label: 'Project Location' },
  { key: 'barangay', label: 'Barangay' },
  { key: 'cityMunicipality', label: 'City / Municipality' },
  // NOTE: province is extracted by OCR but is not currently persisted in LandUseApplication schema
  { key: 'province', label: 'Province' },
  { key: 'lotNumber', label: 'Lot Number' },
  { key: 'blockNumber', label: 'Block Number' },
  { key: 'lotArea', label: 'Lot Area' },
  { key: 'existingLandUse', label: 'Existing Land Use' },
  { key: 'zoningClassification', label: 'Zoning Classification' },
  { key: 'projectTypeNature', label: 'Project Nature / Type' },
  { key: 'projectCost', label: 'Project Cost' }
];

export const PERSISTED_LAND_USE_KEYS = [
  'applicantName',
  'projectLocation',
  'barangay',
  'cityMunicipality',
  'lotNumber',
  'blockNumber',
  'existingLandUse',
  'zoningClassification',
  'projectTypeNature',
  'lotArea',
  'projectCost'
];

export const makeInitialLandUseData = () =>
  Object.fromEntries(LAND_USE_FIELDS.map((f) => [f.key, '']));
