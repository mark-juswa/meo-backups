import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from "../../context/AuthContext";
import { PDFDocument } from 'pdf-lib';
import SuccessModal from '../components/modals/confirmation/SuccessModal';
import { usePHAddress } from '../../hooks/usePHAddress';
import PermitInformationSection from './occupancy/PermitInformationSection';
import OwnerPermitteeSection from './occupancy/OwnerPermitteeSection';
import RequirementsSection from './occupancy/RequirementsSection';
import ProjectDetailsSection from './occupancy/ProjectDetailsSection';
import CertificationSignaturesSection from './occupancy/CertificationSignaturesSection';

const DownloadIcon = () => (
  <svg className="w-5 h-5 inline mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
  </svg>
);

const SuccessIcon = () => (
  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const OccupancyApplication = () => {
  const { buildingId } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    applicationKind: 'FULL', // FULL | PARTIAL
    buildingPermitRef: '',
    isSetupComplete: false,
  });

  const [formData, setFormData] = useState({
    applicationKind: 'FULL', // FULL | PARTIAL (top checkboxes)
    buildingPermitReferenceNo: '', // For looking up the building application
    permitInfo: {
      buildingPermitNo: '',
      buildingPermitDate: '',
      fsecNo: '',
      fsecDate: '',
    },
    ownerDetails: {
      lastName: '',
      givenName: '',
      middleInitial: '',
      address: '',
      zip: '',
      telNo: '',
    },
    requirementsSubmitted: [],
    otherDocs: '',
    projectDetails: {
      projectName: '',
      projectLocation: '',
      occupancyUse: '',
      noStoreys: '',
      noUnits: '',
      totalFloorArea: '',
      dateCompletion: '',
    },
    signatures: {
      ownerName: '',
      ownerCtcNo: '',
      ownerCtcDate: '',
      ownerCtcPlace: '',
      inspectorName: '',
      engineerName: '',
      engineerPrcNo: '',
      engineerPrcValidity: '',
      engineerPtrNo: '',
      engineerPtrDate: '',
      engineerIssuedAt: '',
      engineerTin: '',
      engineerCtcNo: '',
      engineerCtcDate: '',
      engineerCtcPlace: '',
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);

  // Step 1 internal tab state
  const [activeTab, setActiveTab] = useState('permitInfo'); // 'permitInfo' | 'ownerPermittee' | 'requirements' | 'projectDetails' | 'certification'
  const tabs = [
    { id: 'permitInfo', label: 'Permit Information' },
    { id: 'ownerPermittee', label: 'Owner / Permittee' },
    { id: 'requirements', label: 'Requirements Submitted' },
    { id: 'projectDetails', label: 'Project Details' },
    { id: 'certification', label: 'Certification & Signatures' }
  ];

  useEffect(() => {
    if (auth.user) {
      setFormData((prev) => ({
        ...prev,
        ownerDetails: {
          ...prev.ownerDetails,
          lastName: auth.user.last_name || '',
          givenName: auth.user.first_name || '',
          telNo: auth.user.phone_number || ''
        },
      }));
    }
  }, [auth.user]);

  // handlers
  const handlePermitInfoChange = (e) =>
    setFormData(prev => ({ ...prev, permitInfo: { ...prev.permitInfo, [e.target.name]: e.target.value } }));

  const handleOwnerDetailsChange = (e) =>
    setFormData(prev => ({ ...prev, ownerDetails: { ...prev.ownerDetails, [e.target.name]: e.target.value } }));

  const handleProjectDetailsChange = (e) =>
    setFormData(prev => ({ ...prev, projectDetails: { ...prev.projectDetails, [e.target.name]: e.target.value } }));

  const handleSignaturesChange = (e) =>
    setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, [e.target.name]: e.target.value } }));

  const handleOtherDocsChange = (e) => setFormData(prev => ({ ...prev, otherDocs: e.target.value }));

  const handleRequirementsChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newReqs = checked ? [...prev.requirementsSubmitted, value] : prev.requirementsSubmitted.filter(i => i !== value);
      return { ...prev, requirementsSubmitted: newReqs };
    });
  };

  const handleApplicationKind = (kind) => {
    setSetupData(prev => ({ ...prev, applicationKind: kind }));
    setFormData(prev => ({ ...prev, applicationKind: kind }));
  };

  const handleBuildingPermitRefChange = (e) => {
    setSetupData(prev => ({ ...prev, buildingPermitRef: e.target.value }));
    setFormData(prev => ({ ...prev, buildingPermitReferenceNo: e.target.value }));
  };

  // Step 0 handlers
  const handleSetupChange = (field, value) => setSetupData(prev => ({ ...prev, [field]: value }));

  const fetchAndPrefillFromBuildingPermit = async () => {
    if (!setupData.buildingPermitRef.trim()) {
      setError('Building permit reference number is required.');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/applications/track/${setupData.buildingPermitRef}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      const app = res.data?.application;
      if (app?.box1) {
        // Prefill owner
        setFormData(prev => ({
          ...prev,
          buildingPermitReferenceNo: setupData.buildingPermitRef,
          applicationKind: setupData.applicationKind,
          ownerDetails: {
            ...prev.ownerDetails,
            lastName: app.box1.owner?.lastName || prev.ownerDetails.lastName,
            givenName: app.box1.owner?.firstName || prev.ownerDetails.givenName,
            middleInitial: app.box1.owner?.middleInitial || prev.ownerDetails.middleInitial,
            address: `${app.box1.enterprise?.address?.no ? app.box1.enterprise.address.no + ' ' : ''}${app.box1.enterprise?.address?.street || ''}, ${app.box1.enterprise?.address?.barangay || ''}, ${app.box1.enterprise?.address?.city || ''}`.trim(),
            zip: app.box1.enterprise?.address?.zip || prev.ownerDetails.zip,
            telNo: app.box1.enterprise?.address?.telNo || prev.ownerDetails.telNo,
          },
          projectDetails: {
            ...prev.projectDetails,
            projectName: app.box1.enterprise?.projectTitle || prev.projectDetails.projectName,
            projectLocation: `${app.box1.location?.street || ''}, ${app.box1.location?.barangay || ''}, ${app.box1.location?.city || ''}`.trim(),
            occupancyUse: app.box1.occupancy?.classified || prev.projectDetails.occupancyUse,
          }
        }));
      }
      return true;
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Building permit not found for the provided reference number.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const proceedToForm = async () => {
    if (!setupData.buildingPermitRef.trim()) {
      setError('Please enter your Building Permit Reference Number to continue.');
      return;
    }
    const ok = await fetchAndPrefillFromBuildingPermit();
    if (ok) {
      setCurrentStep(1);
      setSetupData(prev => ({ ...prev, isSetupComplete: true }));
    }
  };

  const closeConfirmationModal = () => {
    setShowConfirmationModal(false);
    navigate('/');
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/?status=occupancy_submitted');
  };

  const validateForm = () => {
    // Step 1: Permit Info
    if (!formData.buildingPermitReferenceNo?.trim()) {
      return { valid: false, step: 1, tab: 'permitInfo', message: 'Building permit reference number is required.' };
    }
    if (!formData.permitInfo.buildingPermitDate) {
      return { valid: false, step: 1, tab: 'permitInfo', message: 'Building permit date is required.' };
    }
    if (!formData.permitInfo.fsecNo?.trim()) {
      return { valid: false, step: 1, tab: 'permitInfo', message: 'FSEC No. is required.' };
    }
    if (!formData.permitInfo.fsecDate) {
      return { valid: false, step: 1, tab: 'permitInfo', message: 'FSEC Date is required.' };
    }

    // Step 1: Project Details
    if (!formData.projectDetails.projectName?.trim()) {
      return { valid: false, step: 1, tab: 'projectDetails', message: 'Project name is required.' };
    }
    if (!formData.projectDetails.projectLocation?.trim()) {
      return { valid: false, step: 1, tab: 'projectDetails', message: 'Project location is required.' };
    }
    if (!formData.projectDetails.occupancyUse?.trim()) {
      return { valid: false, step: 1, tab: 'projectDetails', message: 'Use / Character of Occupancy is required.' };
    }
    if (!formData.projectDetails.noStoreys?.toString().trim()) {
      return { valid: false, step: 1, tab: 'projectDetails', message: 'No. of storeys is required.' };
    }
    if (!formData.projectDetails.dateCompletion) {
      return { valid: false, step: 1, tab: 'projectDetails', message: 'Date of completion is required.' };
    }

    // Step 1: Certification & Signatures
    if (!formData.signatures.ownerName?.trim()) {
      return { valid: false, step: 1, tab: 'certification', message: 'Owner name is required.' };
    }
    if (!formData.signatures.inspectorName?.trim()) {
      return { valid: false, step: 1, tab: 'certification', message: 'Inspector name is required.' };
    }
    if (!formData.signatures.engineerName?.trim()) {
      return { valid: false, step: 1, tab: 'certification', message: 'Engineer name is required.' };
    }

    // All good -> Step 2 can submit
    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom validation so hidden required fields don't block submission
    const check = validateForm();
    if (!check.valid) {
      setError(check.message);
      setCurrentStep(check.step);
      if (check.tab) setActiveTab(check.tab);
      // Scroll to top so user sees the error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        applicationKind: formData.applicationKind,
        permitInfo: {
          ...formData.permitInfo,
          buildingPermitNo: formData.buildingPermitReferenceNo, // Add this for schema requirement
          buildingPermitDate: formData.permitInfo.buildingPermitDate,
          fsecNo: formData.permitInfo.fsecNo,
          fsecDate: formData.permitInfo.fsecDate,
        },
        ownerDetails: {
          ...formData.ownerDetails,
          zip: formData.ownerDetails.zip ? Number(formData.ownerDetails.zip) : undefined,
          telNo: formData.ownerDetails.telNo ? Number(formData.ownerDetails.telNo) : undefined,
        },
        requirementsSubmitted: formData.requirementsSubmitted,
        otherDocs: formData.otherDocs,
        projectDetails: {
          ...formData.projectDetails,
          noStoreys: formData.projectDetails.noStoreys ? Number(formData.projectDetails.noStoreys) : undefined,
          noUnits: formData.projectDetails.noUnits ? Number(formData.projectDetails.noUnits) : undefined,
          totalFloorArea: formData.projectDetails.totalFloorArea ? Number(formData.projectDetails.totalFloorArea) : undefined,
        },
        signatures: {
          ...formData.signatures,
          ownerCtcNo: formData.signatures.ownerCtcNo ? Number(formData.signatures.ownerCtcNo) : undefined,
          engineerPrcNo: formData.signatures.engineerPrcNo ? Number(formData.signatures.engineerPrcNo) : undefined,
          engineerPtrNo: formData.signatures.engineerPtrNo ? Number(formData.signatures.engineerPtrNo) : undefined,
          engineerTin: formData.signatures.engineerTin ? Number(formData.signatures.engineerTin) : undefined,
          engineerCtcNo: formData.signatures.engineerCtcNo ? Number(formData.signatures.engineerCtcNo) : undefined,
        },
        buildingPermitIdentifier: formData.buildingPermitReferenceNo,
      };

      const response = await axios.post('/api/applications/occupancy', payload, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });

      // Store submission data and show confirmation modal
      setSubmissionData({
        referenceNo: response.data.referenceNo,
        applicationId: response.data.applicationId,
        ownerName: `${formData.ownerDetails.givenName} ${formData.ownerDetails.lastName}`,
        projectName: formData.projectDetails.projectName || 'N/A',
        location: formData.projectDetails.projectLocation || 'N/A',
        inspectorName: formData.signatures.inspectorName || 'N/A',
        applicationKind: formData.applicationKind,
      });

      setShowConfirmationModal(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  // ---------- PDF generation ----------
  const downloadFormAsPdf = async () => {
    try {
      // adjust path/name to your deployed public PDF
      const url = `${window.location.origin}/certificate_of_occupancy_form.pdf`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not fetch the PDF template. Make sure the file exists at /public/certificate_of_occupancy_form.pdf');
      const formPdfBytes = await res.arrayBuffer();

      const pdfDoc = await PDFDocument.load(formPdfBytes);
      const form = pdfDoc.getForm();

      // top: application type (FULL/PARTIAL)
      try {
        if (form.getCheckBox('app_full') ) {
          if (formData.applicationKind === 'FULL') form.getCheckBox('app_full').check();
          else if (formData.applicationKind === 'PARTIAL') form.getCheckBox('app_partial').check();
        }
      } catch(e){ /* ignore if field missing */ }

      // Permit info
      try { form.getTextField('building_permit_no').setText(formData.permitInfo.buildingPermitNo || ''); } catch(e){}
      try { form.getTextField('building_permit_date').setText(formData.permitInfo.buildingPermitDate ? String(formData.permitInfo.buildingPermitDate) : ''); } catch(e){}
      try { form.getTextField('fsec_no').setText(formData.permitInfo.fsecNo || ''); } catch(e){}
      try { form.getTextField('fsec_date').setText(formData.permitInfo.fsecDate ? String(formData.permitInfo.fsecDate) : ''); } catch(e){}

      // Owner details
      try { form.getTextField('owner_lastname').setText(formData.ownerDetails.lastName || ''); } catch(e){}
      try { form.getTextField('owner_givenname').setText(formData.ownerDetails.givenName || ''); } catch(e){}
      try { form.getTextField('owner_mi').setText(formData.ownerDetails.middleInitial || ''); } catch(e){}
      try { form.getTextField('owner_address').setText(formData.ownerDetails.address || ''); } catch(e){}
      try { form.getTextField('owner_zip').setText(formData.ownerDetails.zip ? String(formData.ownerDetails.zip) : ''); } catch(e){}
      try { form.getTextField('owner_tel').setText(formData.ownerDetails.telNo ? String(formData.ownerDetails.telNo) : ''); } catch(e){}

      // Requirements (checkboxes)
      const reqIds = [
        {val: 'req_permit', field: 'req_building_plans'},
        {val: 'req_logbook', field: 'req_logbook'},
        {val: 'req_photos', field: 'req_photos'},
        {val: 'req_completion', field: 'req_completion'},
        {val: 'req_asbuilt', field: 'req_asbuilt'},
        {val: 'req_fsec', field: 'req_fsec'}
      ];
      reqIds.forEach(item => {
        if (formData.requirementsSubmitted.includes(item.val)) {
          try { form.getCheckBox(item.field).check(); } catch(e) {}
        } else {
          try { form.getCheckBox(item.field).uncheck(); } catch(e) {}
        }
      });
      try { form.getTextField('req_other_text').setText(formData.otherDocs || ''); } catch(e) {}

      // Project details
      try { form.getTextField('project_name').setText(formData.projectDetails.projectName || ''); } catch(e){}
      try { form.getTextField('project_location').setText(formData.projectDetails.projectLocation || ''); } catch(e){}
      try { form.getTextField('occupancy_use').setText(formData.projectDetails.occupancyUse || ''); } catch(e){}
      try { form.getTextField('no_storeys').setText(formData.projectDetails.noStoreys ? String(formData.projectDetails.noStoreys) : ''); } catch(e){}
      try { form.getTextField('no_units').setText(formData.projectDetails.noUnits ? String(formData.projectDetails.noUnits) : ''); } catch(e){}
      try { form.getTextField('total_floor_area').setText(formData.projectDetails.totalFloorArea ? String(formData.projectDetails.totalFloorArea) : ''); } catch(e){}
      try { form.getTextField('date_completion').setText(formData.projectDetails.dateCompletion ? String(formData.projectDetails.dateCompletion) : ''); } catch(e){}

      // Signatures (Owner)
      try { form.getTextField('sig_owner_name').setText(formData.signatures.ownerName || ''); } catch(e){}
      try { form.getTextField('sig_owner_ctc_no').setText(formData.signatures.ownerCtcNo ? String(formData.signatures.ownerCtcNo) : ''); } catch(e){}
      try { form.getTextField('sig_owner_ctc_date').setText(formData.signatures.ownerCtcDate ? String(formData.signatures.ownerCtcDate) : ''); } catch(e){}
      try { form.getTextField('sig_owner_ctc_place').setText(formData.signatures.ownerCtcPlace || ''); } catch(e){}

      // Inspector
      try { form.getTextField('sig_inspector_name').setText(formData.signatures.inspectorName || ''); } catch(e){}

      // Engineer / Architect
      //try { form.getTextField('sig_engineer_name').setText(formData.signatures.engineerName || ''); } catch(e){}
      try { form.getTextField('engineer_prc_no').setText(formData.signatures.engineerPrcNo ? String(formData.signatures.engineerPrcNo) : ''); } catch(e){}
      try { form.getTextField('engineer_prc_validity').setText(formData.signatures.engineerPrcValidity ? String(formData.signatures.engineerPrcValidity) : ''); } catch(e){}
      try { form.getTextField('engineer_ptr_no').setText(formData.signatures.engineerPtrNo ? String(formData.signatures.engineerPtrNo) : ''); } catch(e){}
      try { form.getTextField('engineer_ptr_date').setText(formData.signatures.engineerPtrDate ? String(formData.signatures.engineerPtrDate) : ''); } catch(e){}
      try { form.getTextField('engineer_issued_at').setText(formData.signatures.engineerIssuedAt || ''); } catch(e){}
      try { form.getTextField('engineer_tin').setText(formData.signatures.engineerTin ? String(formData.signatures.engineerTin) : ''); } catch(e){}
      try { form.getTextField('engineer_ctc_no').setText(formData.signatures.engineerCtcNo ? String(formData.signatures.engineerCtcNo) : ''); } catch(e){}
      try { form.getTextField('engineer_ctc_date').setText(formData.signatures.engineerCtcDate ? String(formData.signatures.engineerCtcDate) : ''); } catch(e){}
      try { form.getTextField('engineer_ctc_place').setText(formData.signatures.engineerCtcPlace || ''); } catch(e){}

      // Flatten all fields (same as BuildingApplication)
      try { form.flatten(); } catch(e) { /* ignore if flatten not supported */ }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = 'Occupancy_Certificate_Filled.pdf';
      link.click();
      URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Ensure the template exists and field names match.');
    }
  };

  // error highlight helper (keeps your style pattern similar)
  const errorClass = (flag) => (flag ? 'border-red-500 border-2' : 'border-gray-300');

  // Local helper components for guided address selection (do not alter payload keys)
  const useOwnerAddrState = (inputValue) => {
    const parsed = (inputValue || '').split(',').map(s=>s.trim());
    const street = parsed[0] || '';
    const bgy = parsed[1] || '';
    const cty = parsed[2] || '';
    const prv = parsed[3] || '';
    const [region, setRegion] = useState('');
    const [province, setProvince] = useState(prv);
    const [city, setCity] = useState(cty);
    const [barangay, setBarangay] = useState(bgy);
    const { regionList, provinceList, cityList, barangayList } = usePHAddress(region, province, city);
    const stringify = (st, brgy, c, p) => [st || street, brgy || barangay, c || city, p || province].filter(Boolean).join(', ');
    return { region, setRegion, province, setProvince, city, setCity, barangay, setBarangay, regionList, provinceList, cityList, barangayList, stringify, street };
  };

  const OwnerAddressSelector = ({ value, onChange }) => {
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

  const ProjectLocationSelector = ({ value, onChange }) => {
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
            <option key={r.region_code} value={r.region_code}>{r.region_name || r.name}</option>
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
            <option key={p.province_code} value={p.province_code}>{p.province_name || p.name}</option>
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
            <option key={c.city_code} value={c.city_code}>{c.city_name || c.name}</option>
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
            <option key={b.brgy_code} value={b.brgy_code}>{b.brgy_name || b.name}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="antialiased text-gray-800 bg-gray-100">
      <div id="form-container" className="bg-white p-6 md:p-10 max-w-5xl mx-auto my-6 shadow-2xl rounded-xl border-gray-200">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">Occupancy Permit</h1>
          <p className="text-md text-gray-500">Application for Certificate of Occupancy</p>
        </header>

        {/* Step Indicator */}
        {currentStep >= 0 && (
          <div className="flex justify-center items-center gap-6 sm:gap-12 mb-6">
            <div className={`w-8 h-8 md:w-10 md:h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm md:text-base ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
            <p className={`mt-2 text-xs font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-600'}`}>Application Details</p>
            <div className={`w-8 h-8 md:w-10 md:h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm md:text-base ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
            <p className={`mt-2 text-xs font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-600'}`}>Certification</p>
          </div>
        )}

        {/* STEP 0: Setup */}
        {currentStep === 0 && (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Application Setup</h2>

            <div className="mb-6">
              <p className="text-sm text-gray-700 font-medium mb-2">Select Application Kind</p>
              <div className="flex gap-6 items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="appKind" checked={setupData.applicationKind === 'FULL'} onChange={() => handleApplicationKind('FULL')} />
                  <span>FULL</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="appKind" checked={setupData.applicationKind === 'PARTIAL'} onChange={() => handleApplicationKind('PARTIAL')} />
                  <span>PARTIAL</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                FULL means the entire building is ready for occupancy. PARTIAL is used for a portion or phase of the project.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Building Permit Reference Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={setupData.buildingPermitRef}
                onChange={(e) => handleSetupChange('buildingPermitRef', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter your building permit reference number"
                required
              />
              <p className="text-xs text-gray-500 mt-2">We will use this to prefill your application details from your approved building permit.</p>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={proceedToForm} disabled={loading} className={`px-6 py-2 rounded-lg text-white ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {loading ? 'Loading...' : 'Proceed to Form'}
              </button>
            </div>
            {error && <p className="text-red-600 mt-3">{error}</p>}
          </div>
        )}

        {/* STEP 1+: Main Form */}
        {currentStep >= 1 && (
          <form className="space-y-8" onSubmit={handleSubmit} noValidate>

            {/* Badge */}
            <div className="mb-2 flex justify-center">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-black">
                {setupData.applicationKind} Occupancy Application
              </span>
            </div>

            {/* STEP 1: Tabbed form sections */}
            <div className={currentStep === 1 ? 'block' : 'hidden'}>
              {/* Step 1 Internal Tabs */}
              <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">You can switch tabs anytime. Your input is saved.</p>
              </div>

              {/* Conditional section rendering per activeTab */}
              {activeTab === 'permitInfo' && (
                <PermitInformationSection
                  formData={formData}
                  handleBuildingPermitRefChange={handleBuildingPermitRefChange}
                  handlePermitInfoChange={handlePermitInfoChange}
                />
              )}

              {activeTab === 'ownerPermittee' && (
                <OwnerPermitteeSection
                  formData={formData}
                  setFormData={setFormData}
                  handleOwnerDetailsChange={handleOwnerDetailsChange}
                />
              )}

              {activeTab === 'requirements' && (
                <RequirementsSection
                  formData={formData}
                  handleRequirementsChange={handleRequirementsChange}
                  handleOtherDocsChange={handleOtherDocsChange}
                />
              )}

              {activeTab === 'projectDetails' && (
                <ProjectDetailsSection
                  formData={formData}
                  setFormData={setFormData}
                  handleProjectDetailsChange={handleProjectDetailsChange}
                />
              )}

              {activeTab === 'certification' && (
                <CertificationSignaturesSection
                  formData={formData}
                  handleSignaturesChange={handleSignaturesChange}
                  downloadFormAsPdf={downloadFormAsPdf}
                  loading={loading}
                  error={error}
                  hideActions={true}
                />
              )}
            </div>

            {/* STEP 2: Review / Submit */}
            <div className={currentStep === 2 ? 'block' : 'hidden'}>
              
              <CertificationSignaturesSection
                formData={formData}
                handleSignaturesChange={handleSignaturesChange}
                downloadFormAsPdf={downloadFormAsPdf}
                loading={loading}
                error={error}
                hideActions={true}
              />
            </div>

            {/* Navigation Buttons */}
            <div id="nav-buttons" className="flex justify-between gap-3 mt-6 sm:mt-8">
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    const idx = tabs.findIndex(t => t.id === activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1].id);
                  } else {
                    setCurrentStep(s => Math.max(1, s - 1));
                  }
                }}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm sm:text-base ${currentStep > 1 || (currentStep === 1 && activeTab !== tabs[0].id) ? 'block' : 'hidden'}`}
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    const idx = tabs.findIndex(t => t.id === activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                    else setCurrentStep(2);
                  } else if (currentStep < 2) {
                    setCurrentStep(s => Math.min(2, s + 1));
                  }
                }}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-sm sm:text-base ${currentStep < 2 ? 'block' : 'hidden'}`}
              >
                Next
              </button>

              <button type="submit" disabled={loading} className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 text-white font-semibold rounded-lg text-sm sm:text-base ${currentStep === 2 ? 'block' : 'hidden'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>{loading ? 'Submitting...' : 'Submit Application'}</button>
            </div>
          </form>
        )}  

    
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div id="confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 md:p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <SuccessIcon />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Application Submission Confirmed!</h2>
              <p className="text-gray-600 text-center mt-2">Your application (Ref: <span className="font-bold">{submissionData?.referenceNo}</span>) has been successfully lodged.</p>
            </div>
            <div className="flex flex-col space-y-3">
              <button type="button" onClick={downloadFormAsPdf} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg"><DownloadIcon /> Download Full Form (PDF)</button>
                            <button onClick={closeConfirmationModal} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Skip Documents & Go Home</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Application Submitted Successfully!"
        message={`Your occupancy permit application has been submitted successfully. Your reference number is: ${submissionData?.referenceNo}. You can track your application status from the homepage.`}
        buttonText="Go to Homepage"
      />
    </div>
  );
};

export default OccupancyApplication;
