// Shared field definitions for HLURB Locational Clearance OCR assist

export const LAND_USE_FIELDS = [
  // Administrative fields
  { key: 'application_no', label: 'Application No.', section: 'Administrative' },
  { key: 'date_of_receipt', label: 'Date of Receipt', section: 'Administrative' },
  { key: 'or_no', label: 'O.R. No.', section: 'Administrative' },
  { key: 'or_date_issued', label: 'O.R. Date Issued', section: 'Administrative' },
  { key: 'or_amount_paid', label: 'Amount Paid', section: 'Administrative' },
  
  // Applicant details
  { key: 'applicant_name', label: 'Name of Applicant', section: 'Applicant Details' },
  { key: 'corporation_name', label: 'Name of Corporation', section: 'Applicant Details' },
  { key: 'applicant_address', label: 'Address of Applicant', section: 'Applicant Details' },
  { key: 'corporation_address', label: 'Address of Corporation', section: 'Applicant Details' },
  { key: 'authorized_rep_name', label: 'Authorized Representative Name', section: 'Applicant Details' },
  { key: 'authorized_rep_address', label: 'Authorized Representative Address', section: 'Applicant Details' },
  
  // Project details
  { key: 'project_type', label: 'Project Type', section: 'Project Details' },
  { key: 'project_nature_new', label: 'Project Nature: New Development', section: 'Project Details', type: 'checkbox' },
  { key: 'project_nature_existing', label: 'Project Nature: Existing', section: 'Project Details', type: 'checkbox' },
  { key: 'project_nature_other', label: 'Project Nature: Others (specify)', section: 'Project Details' },
  { key: 'project_location', label: 'Project Location', section: 'Project Details' },
  { key: 'project_tenure_permanent', label: 'Project Tenure: Permanent', section: 'Project Details', type: 'checkbox' },
  { key: 'project_tenure_temporary', label: 'Project Tenure: Temporary (specify)', section: 'Project Details' },
  
  // Land rights
  { key: 'right_owner', label: 'Right over Land: Owner', section: 'Land Rights', type: 'checkbox' },
  { key: 'right_lessee', label: 'Right over Land: Lessee', section: 'Land Rights', type: 'checkbox' },
  { key: 'right_other', label: 'Right over Land: Others (specify)', section: 'Land Rights' },
  
  // Areas
  { key: 'lot_area_sqm', label: 'Lot Area (sq.m.)', section: 'Project Areas' },
  { key: 'building_area', label: 'Building/Improvement Area', section: 'Project Areas' },
  
  // Land use classifications
  { key: 'land_use_residential', label: 'Existing Land Use: Residential', section: 'Land Use', type: 'checkbox' },
  { key: 'land_use_institutional', label: 'Existing Land Use: Institutional', section: 'Land Use', type: 'checkbox' },
  { key: 'land_use_commercial', label: 'Existing Land Use: Commercial', section: 'Land Use', type: 'checkbox' },
  { key: 'land_use_industrial', label: 'Existing Land Use: Industrial', section: 'Land Use', type: 'checkbox' },
  { key: 'land_use_vacant', label: 'Existing Land Use: Vacant/Idle', section: 'Land Use', type: 'checkbox' },
  { key: 'land_use_agricultural', label: 'Existing Land Use: Agricultural (specify crops)', section: 'Land Use' },
  
  // Administrative processes
  { key: 'notice_date', label: 'Date of Notice', section: 'Administrative Process' },
  { key: 'applied_other_yes', label: 'Applied for Similar Application: Yes', section: 'Administrative Process', type: 'checkbox' },
  { key: 'applied_other_no', label: 'Applied for Similar Application: No', section: 'Administrative Process', type: 'checkbox' },
  { key: 'other_application_date', label: 'Other Application Date Filed', section: 'Administrative Process' },
  { key: 'other_application_action', label: 'Other Application Action Taken', section: 'Administrative Process' },
  
  // Signatures
  { key: 'rep_signature_name', label: 'Authorized Representative Signature Name', section: 'Signatures' },
  { key: 'applicant_signature_name', label: 'Applicant Signature Name', section: 'Signatures' }
];

export const PERSISTED_LAND_USE_KEYS = [
  // All fields are now persisted in the expanded schema
  'application_no', 'date_of_receipt', 'or_no', 'or_date_issued', 'or_amount_paid',
  'applicant_name', 'corporation_name', 'applicant_address', 'corporation_address', 'authorized_rep_name', 'authorized_rep_address',
  'project_type', 'project_nature_new', 'project_nature_existing', 'project_nature_other', 'project_location', 'project_tenure_permanent', 'project_tenure_temporary',
  'right_owner', 'right_lessee', 'right_other',
  'lot_area_sqm', 'building_area',
  'land_use_residential', 'land_use_institutional', 'land_use_commercial', 'land_use_industrial', 'land_use_vacant', 'land_use_agricultural',
  'notice_date', 'applied_other_yes', 'applied_other_no', 'other_application_date', 'other_application_action',
  'rep_signature_name', 'applicant_signature_name'
];

export const makeInitialLandUseData = () =>
  Object.fromEntries(LAND_USE_FIELDS.map((f) => [f.key, '']));
