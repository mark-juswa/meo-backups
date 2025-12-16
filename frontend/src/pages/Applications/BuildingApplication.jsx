import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { PDFDocument } from 'pdf-lib';
import SuccessModal from '../components/modals/confirmation/SuccessModal';

// Import redesigned Step 1 component
import Step1Redesigned from './sections/Step1Redesigned';

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

const BuildingApplication = () => {
  const [currentStep, setCurrentStep] = useState(0); // START AT STEP 0
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  // NEW: STEP 0 STATE - Application Setup
  const [setupData, setSetupData] = useState({
    projectComplexity: '', // 'simple' | 'complex'
    applicationType: '', // 'new' | 'renewal' | 'amendatory'
    existingPermitRef: '',
    isSetupComplete: false
  });

  // STATE
  const [box1, setBox1] = useState({
    owner: { lastName: '', firstName: '', middleInitial: '', tin: '' },
    enterprise: {
      formOfOwnership: '',
      formOfOwnershipOther: '',
      projectTitle: '',
      address: { no: '', street: '', barangay: '', city: '', zip: '', telNo: '' },
    },
    location: {
      lotNo: '',
      blkNo: '',
      tctNo: '',
      taxDecNo: '',
      street: '',
      barangay: '',
      city: '',
    },
    scopeOfWork: [],
    occupancy: { group: '', classified: '' },
    projectDetails: {
      numberOfUnits: '',
      totalEstimatedCost: '',
      totalFloorArea: '',
      lotArea: '',
      proposedConstruction: '',
      expectedCompletion: '',
    },
  });

  const [box2, setBox2] = useState({
    name: '',
    date: '',
    address: '',
    prcNo: '',
    validity: '',
    ptrNo: '',
    ptrDate: '',
    issuedAt: '',
    tin: '',
  });

  const [box3, setBox3] = useState({
    name: '',
    date: '',
    address: '',
    ctcNo: '',
    dateIssued: '',
    placeIssued: '',
  });

  const [box4, setBox4] = useState({
    name: '',
    date: '',
    address: '',
    tctNo: '',
    taxDecNo: '',
    placeIssued: '',
  });

  // ---------- Handlers ----------
  const handleOwnerChange = (e) =>
    setBox1((prev) => ({ ...prev, owner: { ...prev.owner, [e.target.name]: e.target.value } }));

  const handleEnterpriseChange = (e) =>
    setBox1((prev) => ({ ...prev, enterprise: { ...prev.enterprise, [e.target.name]: e.target.value } }));

  const handleEnterpriseAddressChange = (e) =>
    setBox1((prev) => ({ ...prev, enterprise: { ...prev.enterprise, address: { ...prev.enterprise.address, [e.target.name]: e.target.value } } }));

  const handleLocationChange = (e) =>
    setBox1((prev) => ({ ...prev, location: { ...prev.location, [e.target.name]: e.target.value } }));

  const handleProjectDetailsChange = (e) => {
    const { name, value } = e.target;
    setBox1((prev) => ({ ...prev, projectDetails: { ...prev.projectDetails, [name]: value } }));
  };

  const handleScopeChange = (e) => {
    const { value, checked } = e.target;
    setBox1((prev) => {
      const newScope = checked ? [...prev.scopeOfWork, value] : prev.scopeOfWork.filter((item) => item !== value);
      return { ...prev, scopeOfWork: newScope };
    });
  };

  const handleOccupancyChange = (e) =>
    setBox1((prev) => ({ ...prev, occupancy: { ...prev.occupancy, [e.target.name]: e.target.value } }));

  const handleBox2Change = (e) => setBox2((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBox3Change = (e) => setBox3((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBox4Change = (e) => setBox4((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // NEW: STEP 0 HANDLERS
  const handleSetupChange = (field, value) => {
    setSetupData(prev => ({ ...prev, [field]: value }));
  };

  // NEW: Fetch existing application for renewal/amendatory
  const fetchExistingApplication = async () => {
    if (!setupData.existingPermitRef.trim()) {
      alert('Please enter the Building Permit Reference Number.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `/api/applications/track/${setupData.existingPermitRef}`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` }}
      );
      
      const existing = response.data.application;
      
      // Prefill all state from existing application
      if (existing.box1) setBox1(existing.box1);
      if (existing.box2) setBox2(existing.box2);
      if (existing.box3) setBox3(existing.box3);
      if (existing.box4) setBox4(existing.box4);
      
      // Show appropriate message
      if (setupData.applicationType === 'amendatory') {
        alert('Application data loaded successfully.\n\nYou are filing an AMENDATORY application. Please update only the fields that have changed.');
      } else {
        alert('Renewal data loaded successfully.\n\nPlease review and update the information as needed.');
      }
      
      // Move to Step 1
      setCurrentStep(1);
      setSetupData(prev => ({ ...prev, isSetupComplete: true }));
    } catch (error) {
      console.error('Lookup failed:', error);
      alert(`Application not found: ${error.response?.data?.message || 'Please check the reference number and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Proceed to form from Step 0
  const proceedToForm = () => {
    if (!setupData.projectComplexity) {
      alert('Please select a project complexity.');
      return;
    }
    if (!setupData.applicationType) {
      alert('Please select an application type.');
      return;
    }

    if (setupData.applicationType === 'new') {
      // Start with empty form
      setCurrentStep(1);
      setSetupData(prev => ({ ...prev, isSetupComplete: true }));
    } else {
      // Must fetch existing data first
      fetchExistingApplication();
    }
  };
 
  const validateStep1 = () => {
    const newErrors = {};
    if (!box1.owner.lastName) newErrors.owner_last_name = 'Required';
    if (!box1.owner.firstName) newErrors.owner_first_name = 'Required';

    if (!box1.location.street) newErrors.loc_street = 'Required';
    if (!box1.location.barangay) newErrors.loc_barangay = 'Required';
    if (!box1.location.city) newErrors.loc_city = 'Required';
    if (box1.scopeOfWork.length === 0) newErrors.scope = 'Select at least one';
    if (!box1.occupancy.group) newErrors.occupancy = 'Select one';
    if (!box1.projectDetails.totalEstimatedCost) newErrors.total_estimated_cost = 'Required';
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    // Box 2 (Architect/Engineer) - disabled for user input, no validation needed
    
    if (!box3.name) newErrors.applicant_name = 'Required';
    if (!box3.date) newErrors.applicant_sign_date = 'Required';
    if (!box3.address) newErrors.applicant_address = 'Required';

    return newErrors;
  };

  const nextStep = () => {
    let newErrors = {};
    if (currentStep === 1) newErrors = validateStep1();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert(`Action Blocked: Please fill out ALL required fields in Step ${currentStep} to proceed.`);
    } else {
      setErrors({});
      if (currentStep < 2) setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep === 1) {
      // Going back to Step 0 - show confirmation
      const confirmBack = window.confirm('Are you sure you want to go back to setup? Your form data will be preserved.');
      if (confirmBack) {
        setCurrentStep(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  const toNum = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const cleaned = String(val).replace(/[^0-9.]/g, ''); 
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  };


  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateStep2();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert(`Action Blocked: Please fill out ALL required fields in Step ${currentStep} to submit.`);
      return;
    }

    setLoading(true);
    setErrors({});

    // Force Numbers where Schema expects Numbers
    const payload = {
      box1: {
        ...box1,
        owner: {
            ...box1.owner,
            tin: toNum(box1.owner.tin) 
        },
        enterprise: {
          ...box1.enterprise,
          formOfOwnership:
            box1.enterprise.formOfOwnership === 'Others'
              ? box1.enterprise.formOfOwnershipOther
              : box1.enterprise.formOfOwnership,
          address: {
            ...box1.enterprise.address,
            no: toNum(box1.enterprise.address.no), 
            zip: toNum(box1.enterprise.address.zip),
            telNo: toNum(box1.enterprise.address.telNo), 
          }
        },
        location: {
            ...box1.location,
            blkNo: toNum(box1.location.blkNo), 
            tctNo: toNum(box1.location.tctNo),
            taxDecNo: toNum(box1.location.taxDecNo), 
        },
        projectDetails: {
          ...box1.projectDetails,
          numberOfUnits: toNum(box1.projectDetails.numberOfUnits),
          totalEstimatedCost: toNum(box1.projectDetails.totalEstimatedCost), 
          totalFloorArea: toNum(box1.projectDetails.totalFloorArea), 
          lotArea: toNum(box1.projectDetails.lotArea), 
        }
      },
      box2: {
        ...box2,
        prcNo: toNum(box2.prcNo), 
        ptrNo: toNum(box2.ptrNo), 
        tin: toNum(box2.tin),     
      },
      box3: {
        ...box3,
        ctcNo: toNum(box3.ctcNo),
      },
      box4: {
        ...box4,
        tctNo: toNum(box4.tctNo), 
        taxDecNo: toNum(box4.taxDecNo), 
      }
    };

    try {
      const response = await axios.post('/api/applications/building', payload, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });

      // Store submission data and show confirmation modal
      setSubmissionData({
        referenceNo: response.data.referenceNo,
        applicationId: response.data.applicationId,
        ownerName: `${box1.owner.firstName} ${box1.owner.lastName}`,
        projectTitle: box1.enterprise.projectTitle || 'N/A',
        location: `${box1.location.street}, ${box1.location.barangay}, ${box1.location.city}`,
        archEngName: box2.name,
        scopeList: box1.scopeOfWork.length > 0 ? box1.scopeOfWork.join(', ') : 'Not specified',
      });

      setShowConfirmationModal(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrors({ api: err.response?.data?.message || 'An error occurred during submission.' });
      alert(`Submission Error: ${err.response?.data?.message || 'An error occurred. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const closeConfirmationModal = () => {
    setShowConfirmationModal(false);
    navigate('/');
  };

  const goToDocumentUpload = () => {
    setShowConfirmationModal(false);
    navigate(`/application/documents/${submissionData.applicationId}`, {
      state: { applicationData: submissionData }
    });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/?status=building_submitted');
  };

  
  const downloadFormAsPdf = async () => {
    try {
      const url = `${window.location.origin}/building_permit_form_fillable.pdf`;

      const formPdfBytes = await fetch(url).then((r) => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(formPdfBytes);
      const form = pdfDoc.getForm();
      
      form.getTextField('owner_lastname').setText(box1.owner.lastName || '');
      form.getTextField('owner_firstname').setText(box1.owner.firstName || '');
      form.getTextField('owner_mi').setText(box1.owner.middleInitial || '');
      form.getTextField('owner_tin').setText(box1.owner.tin ? String(box1.owner.tin) : '');

      form.getTextField('ent_form').setText(
        box1.enterprise.formOfOwnership === 'Others'
          ? box1.enterprise.formOfOwnershipOther || ''
          : box1.enterprise.formOfOwnership || ''
      );

      form.getTextField('ent_addr_no').setText(box1.enterprise.address.no ? String(box1.enterprise.address.no) : '');
      form.getTextField('ent_addr_street').setText(box1.enterprise.address.street || '');
      form.getTextField('ent_addr_brgy').setText(box1.enterprise.address.barangay || '');
      form.getTextField('ent_addr_city').setText(box1.enterprise.address.city || '');
      form.getTextField('ent_addr_zip').setText(box1.enterprise.address.zip || '');
      form.getTextField('ent_addr_tel').setText(box1.enterprise.address.telNo ? String(box1.enterprise.address.telNo) : '');

      form.getTextField('loc_lot').setText(box1.location.lotNo || '');
      form.getTextField('loc_blk').setText(box1.location.blkNo ? String(box1.location.blkNo) : '');
      form.getTextField('loc_tct').setText(box1.location.tctNo ? String(box1.location.tctNo) : '');
      form.getTextField('loc_taxdec').setText(box1.location.taxDecNo ? String(box1.location.taxDecNo) : '');
      form.getTextField('loc_street').setText(box1.location.street || '');
      form.getTextField('loc_brgy').setText(box1.location.barangay || '');
      form.getTextField('loc_city').setText(box1.location.city || '');


      const scopes = box1.scopeOfWork || [];
      const scopeIds = [
        'new', 'erection', 'addition', 'alteration', 'renovation',
        'conversion', 'repair', 'moving', 'raising', 'accessory', 'others'
      ];

      scopeIds.forEach((id) => {
        try {
          const cb = form.getCheckBox(`scope_${id}`);
          if (scopes.includes(id)) {
            cb.check();
          } else {
            cb.uncheck();
          }
        } catch (e) {
        }
      });

      if (scopes.includes('others')) {
        try { form.getTextField('scope_others_text').setText(box1.occupancy.classified || ''); } catch (e) {}
      }

      // --- HANDLE OCCUPANCY CHECKBOXES ---
      const occ = box1.occupancy.group || '';

      const occMap = {
        group_a: 'occ_group_a',
        group_b: 'occ_group_b',
        group_c: 'occ_group_c',
        group_d: 'occ_group_d',
        group_e: 'occ_group_e',
        group_f: 'occ_group_f',
        group_g: 'occ_group_g',
        group_h_load_lt_1000: 'occ_group_h1',
        group_h_load_gt_1000: 'occ_group_h2',
        group_i: 'occ_group_i',
        group_j: 'occ_group_j',
        others: 'occ_group_others'
      };

      Object.values(occMap).forEach((fieldName) => {
        try { form.getCheckBox(fieldName).uncheck(); } catch (e) {}
      });

      if (occMap[occ]) {
        try { form.getCheckBox(occMap[occ]).check(); } catch (e) {}
      }

      if (occ === 'others') {
        try { form.getTextField('occ_others_text').setText(box1.occupancy.classified || ''); } catch (e) {}
      }

      // PROJECT DETAILS
      form.getTextField('occupancy_classified').setText(box1.occupancy.classified || '');
      form.getTextField('proj_units').setText(box1.projectDetails.numberOfUnits ? String(box1.projectDetails.numberOfUnits) : '');
      form.getTextField('proj_tfa').setText(box1.projectDetails.totalFloorArea ? String(box1.projectDetails.totalFloorArea) : '');
      form.getTextField('proj_lot_area').setText(box1.projectDetails.lotArea ? String(box1.projectDetails.lotArea) : '');
      form.getTextField('proj_total_cost').setText(box1.projectDetails.totalEstimatedCost ? String(box1.projectDetails.totalEstimatedCost) : '');
      form.getTextField('proj_start_date').setText(box1.projectDetails.proposedConstruction || '');
      form.getTextField('proj_end_date').setText(box1.projectDetails.expectedCompletion || '');

      // BOX 2
      form.getTextField('box2_name').setText(box2.name || '');
      form.getTextField('box2_date').setText(box2.date || '');
      form.getTextField('box2_address').setText(box2.address || '');
      form.getTextField('box2_prc').setText(box2.prcNo ? String(box2.prcNo) : '');
      form.getTextField('box2_validity').setText(box2.validity || '');
      form.getTextField('box2_ptr').setText(box2.ptrNo ? String(box2.ptrNo) : '');
      form.getTextField('box2_ptr_date').setText(box2.ptrDate || '');
      form.getTextField('box2_issued_at').setText(box2.issuedAt || '');
      form.getTextField('box2_tin').setText(box2.tin ? String(box2.tin) : '');

      // BOX 3
      form.getTextField('box3_name').setText(box3.name || '');
      form.getTextField('box3_date').setText(box3.date || '');
      form.getTextField('box3_address').setText(box3.address || '');
      form.getTextField('box3_ctc').setText(box3.ctcNo ? String(box3.ctcNo) : '');
      form.getTextField('box3_ctc_date').setText(box3.dateIssued || '');
      form.getTextField('box3_ctc_place').setText(box3.placeIssued || '');

      // BOX 4
      form.getTextField('box4_name').setText(box4.name || '');
      form.getTextField('box4_date').setText(box4.date || '');
      form.getTextField('box4_address').setText(box4.address || '');
      form.getTextField('box4_ctc').setText(box4.tctNo ? String(box4.tctNo) : '');
      form.getTextField('box4_ctc_date').setText(box4.taxDecNo ? String(box4.taxDecNo) : '');
      form.getTextField('box4_ctc_place').setText(box4.placeIssued || '');


      form.flatten();

  
      // SAVE & DOWNLOAD PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const urlBlob = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = 'Building_Permit_Application.pdf';
      link.click();

    } catch (err) {
      console.error('ERROR generating PDF:', err);
      alert('Failed to generate PDF. Please ensure the fillable PDF exists.');
    }
  };

  const SCOPE_OPTIONS = [
  { value: 'new', label: 'NEW' },
  { value: 'erection', label: 'ERECTION' },
  { value: 'addition', label: 'ADDITION' },
  { value: 'alteration', label: 'ALTERATION' },
  { value: 'renovation', label: 'RENOVATION' },
  { value: 'conversion', label: 'CONVERSION' },
  { value: 'repair', label: 'REPAIR' },
  { value: 'moving', label: 'MOVING' },
  { value: 'raising', label: 'RAISING' },
  { value: 'accessory', label: 'ACCESSORY' },
  { value: 'others', label: 'OTHERS' }
];


  const errorClass = (fieldName) => (errors[fieldName] ? 'border-red-500 border-2' : 'border-gray-300');

  return (
    <div className="antialiased text-gray-800 bg-gray-100 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div id="main-form-content" className="max-w-5xl mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg border border-gray-200">
          <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">
            {currentStep === 0 ? 'Building Permit Application Setup' : 'Official Building Permit Application Form'}
          </h1>
          <p id="form-subtitle" className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
            {currentStep === 0 
              ? 'Configure your application type before proceeding to the form.' 
              : 'Please fill in all mandatory fields (Steps 1-2).'}
          </p>

          {/* STEP 0: APPLICATION SETUP */}
          {currentStep === 0 && (
            <div className="application-setup space-y-8">
              {/* Project Complexity */}
              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">1. Project Complexity</h2>
                <div className="space-y-3">
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${setupData.projectComplexity === 'simple' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="complexity"
                      value="simple"
                      checked={setupData.projectComplexity === 'simple'}
                      onChange={(e) => handleSetupChange('projectComplexity', e.target.value)}
                      className="mt-1 mr-3 h-5 w-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <strong className="text-base sm:text-lg block mb-1">Simple</strong>
                      <p className="text-sm text-gray-600">Residential homes, small repairs, minor alterations</p>
                    </div>
                  </label>
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${setupData.projectComplexity === 'complex' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="complexity"
                      value="complex"
                      checked={setupData.projectComplexity === 'complex'}
                      onChange={(e) => handleSetupChange('projectComplexity', e.target.value)}
                      className="mt-1 mr-3 h-5 w-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <strong className="text-base sm:text-lg block mb-1">Complex</strong>
                      <p className="text-sm text-gray-600">Commercial buildings, multi-story structures, major structural changes</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Application Type */}
              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">2. Application Type</h2>
                <div className="space-y-3">
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${setupData.applicationType === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="applicationType"
                      value="new"
                      checked={setupData.applicationType === 'new'}
                      onChange={(e) => handleSetupChange('applicationType', e.target.value)}
                      className="mt-1 mr-3 h-5 w-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <strong className="text-base sm:text-lg block mb-1">New Application</strong>
                      <p className="text-sm text-gray-600">First-time application for this project</p>
                    </div>
                  </label>
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${setupData.applicationType === 'renewal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="applicationType"
                      value="renewal"
                      checked={setupData.applicationType === 'renewal'}
                      onChange={(e) => handleSetupChange('applicationType', e.target.value)}
                      className="mt-1 mr-3 h-5 w-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <strong className="text-base sm:text-lg block mb-1">Renewal</strong>
                      <p className="text-sm text-gray-600">Renew an expired or expiring building permit</p>
                    </div>
                  </label>
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${setupData.applicationType === 'amendatory' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="applicationType"
                      value="amendatory"
                      checked={setupData.applicationType === 'amendatory'}
                      onChange={(e) => handleSetupChange('applicationType', e.target.value)}
                      className="mt-1 mr-3 h-5 w-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <strong className="text-base sm:text-lg block mb-1">Amendatory</strong>
                      <p className="text-sm text-gray-600">Modify an existing approved building permit</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Conditional: Reference Number for Renewal/Amendatory */}
              {(setupData.applicationType === 'renewal' || setupData.applicationType === 'amendatory') && (
                <section className="p-6 bg-amber-50 border-2 border-amber-100 rounded-lg">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 text-amber-800">Existing Permit Reference</h2>
                  <p className="text-sm text-gray-700 mb-4">
                    Enter the reference number of your existing building permit:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="e.g., B-2301000001"
                      value={setupData.existingPermitRef}
                      onChange={(e) => handleSetupChange('existingPermitRef', e.target.value)}
                      className="flex-1 px-4 py-2 text-sm sm:text-base border-2 border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 italic">
                    Your existing application data will be automatically loaded and prefilled.
                  </p>
                </section>
              )}

              {/* Continue Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={proceedToForm}
                  disabled={!setupData.projectComplexity || !setupData.applicationType || loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold text-base disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading Application...
                    </span>
                  ) : 'Continue to Application Form'}
                </button>
              </div>
            </div>
          )}

          {/* Progress Indicator - Only show for Steps 1+ */}
          {currentStep >= 1 && (
            <div id="progress-indicator" className="flex items-center justify-between mb-8">
              <div className="flex-1 text-center">
                <div className={`w-8 h-8 md:w-10 md:h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm md:text-base ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-600'}`}>Applicant & Project</p>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-1 md:mx-4 rounded-full"></div>
              <div className="flex-1 text-center">
                <div className={`w-8 h-8 md:w-10 md:h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm md:text-base ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
                <p className={`mt-2 text-xs font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-600'}`}>Authorization</p>
              </div>
            </div>
          )}

          {/* Application Type Badge - Show on all form steps */}
          {currentStep >= 1 && setupData.applicationType && (
            <div className="mb-6 flex justify-center">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                setupData.applicationType === 'new' ? 'text-black' :
                setupData.applicationType === 'renewal' ? ' text-black' :
                'bg-orange-100 text-orange-800'
              }`}>
                {setupData.applicationType === 'new' && 'New Application'}
                {setupData.applicationType === 'renewal' && 'Renewal Application'}
                {setupData.applicationType === 'amendatory' && 'Amendatory Application'}
              </span>
            </div>
          )}

          {currentStep >= 1 && (
            <form onSubmit={handleConfirmSubmit}>
            {/* BOX 1 - REDESIGNED */}
            <div id="form-section-1" className={currentStep === 1 ? 'mb-8' : 'hidden'}>
              <Step1Redesigned box1={box1} setBox1={setBox1} errors={errors} />
            </div>

            {/* BOX 2, 3, 4 */}
            <div id="form-section-2" className={currentStep === 2 ? 'mb-8' : 'hidden'}>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 border-b pb-2 text-blue-600">2. Authorization & Signatures</h2>

              <h3 className="font-medium text-base sm:text-lg text-gray-700 mt-2 mb-3 border-b pb-2">BOX 2: Architect / Engineer (To be filled by professionals only)</h3>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 sm:p-4 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <div className="border-b-2 border-gray-300 pb-1 mt-4 text-sm text-gray-500 signature-block">
                      <input type="text" placeholder="[To be filled by Architect/Engineer]" name="name" value={box2.name} className="w-full text-center border-0 p-0 focus:ring-0 bg-gray-50 text-gray-500" disabled />
                    </div>
                    <span className="block mt-1 text-xs italic text-gray-500">(Signature Over Printed Name)</span>
                    <div className="flex mt-2">
                      <label className="block text-xs font-medium text-gray-500 pr-2 pt-1">Date:</label>
                      <input type="date" name="date" value={box2.date} className="flex-grow px-3 py-1 rounded-md shadow-sm text-sm bg-gray-50 border-gray-300 text-gray-500" disabled />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Address</label>
                      <input type="text" name="address" value={box2.address} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm bg-gray-50 border-gray-300 text-gray-500" disabled />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">PRC No.</label>
                        <input type="number" name="prcNo" value={box2.prcNo} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm bg-gray-50 border-gray-300 text-gray-500" disabled />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Validity</label>
                        <input type="date" name="validity" value={box2.validity} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm bg-gray-50 border-gray-300 text-gray-500" disabled />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">PTR No.</label>
                        <input type="number" name="ptrNo" value={box2.ptrNo} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm bg-gray-50 border-gray-300 text-gray-500" disabled />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Date Issued</label>
                        <input type="date" name="ptrDate" value={box2.ptrDate} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm bg-gray-50 border-gray-300 text-gray-500" disabled />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Issued at</label>
                        <input type="text" name="issuedAt" value={box2.issuedAt} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm bg-gray-50 border-gray-300 text-gray-500" disabled />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">TIN</label>
                        <input type="number" name="tin" value={box2.tin} className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm bg-gray-50 border-gray-300 text-gray-500" disabled />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t">
                {/* Box 3 */}
                <div>
                  <h3 className="font-medium text-base sm:text-lg text-gray-700 mb-3">BOX 3: Applicant</h3>
                  <div className="border-b-2 border-blue-500 pb-1 mt-4 text-sm text-gray-700 signature-block">
                    <input type="text" placeholder="[Type Name Here]" name="name" value={box3.name} onChange={handleBox3Change} className={`w-full text-center border-0 p-0 focus:ring-0 text-sm sm:text-base ${errorClass('applicant_name')}`} required />
                  </div>
                  <span className="block mt-1 text-xs italic text-gray-600">(Signature Over Printed Name)</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                    <label className="block text-xs font-medium text-gray-700 sm:pr-2">Date:</label>
                    <input type="date" name="date" value={box3.date} onChange={handleBox3Change} className={`flex-grow px-3 py-2 rounded-md shadow-sm text-sm border ${errorClass('applicant_sign_date')}`} required />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                      <input type="text" name="address" value={box3.address} onChange={handleBox3Change} className={`block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border ${errorClass('applicant_address')}`} required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">CTC No.</label>
                        <input type="number" name="ctcNo" value={box3.ctcNo} onChange={handleBox3Change} className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date Issued</label>
                        <input type="date" name="dateIssued" value={box3.dateIssued} onChange={handleBox3Change} className="mt-1 block w-full px-3 py-2 text-sm rounded-md shadow-sm border border-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Place Issued</label>
                        <input type="text" name="placeIssued" value={box3.placeIssued} onChange={handleBox3Change} className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box 4 */}
                <div>
                  <h3 className="font-medium text-base sm:text-lg text-gray-700 mb-3">BOX 4: Lot Owner</h3>
                  <div className="border-b-2 border-blue-500 pb-1 mt-4 text-sm text-gray-700 signature-block">
                    <input type="text" placeholder="[Type Name Here]" name="name" value={box4.name} onChange={handleBox4Change} className={`w-full text-center border-0 p-0 focus:ring-0 text-sm sm:text-base ${errorClass('lot_owner_name')}`} required />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                    <label className="block text-xs font-medium text-gray-700 sm:pr-2">Date:</label>
                    <input type="date" name="date" value={box4.date} onChange={handleBox4Change} className={`flex-grow px-3 py-2 rounded-md shadow-sm text-sm border ${errorClass('lot_owner_sign_date')}`} required />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                      <input type="text" name="address" value={box4.address} onChange={handleBox4Change} className={`block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border ${errorClass('lot_owner_address')}`} required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">TCT No.</label>
                        <input type="number" name="tctNo" value={box4.tctNo} onChange={handleBox4Change} className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tax Dec.</label>
                        <input type="number" name="taxDecNo" value={box4.taxDecNo} onChange={handleBox4Change} className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Place Issued</label>
                        <input type="text" name="placeIssued" value={box4.placeIssued} onChange={handleBox4Change} className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md shadow-sm border border-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="nav-buttons" className="flex justify-between gap-3 mt-6 sm:mt-8">
              <button type="button" onClick={prevStep} className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm sm:text-base ${currentStep > 1 ? 'block' : 'hidden'}`}>Previous</button>
              <button type="button" onClick={nextStep} className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-sm sm:text-base ${currentStep < 2 ? 'block' : 'hidden'}`}>Next</button>
              <button type="submit" disabled={loading} className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 text-white font-semibold rounded-lg text-sm sm:text-base ${currentStep === 2 ? 'block' : 'hidden'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>{loading ? 'Submitting...' : 'Confirm & Submit'}</button>
            </div>
          </form>
        )}
        </div>
      </div>


      {showConfirmationModal && (
        <div id="confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col items-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <SuccessIcon />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">Application Submission Confirmed!</h2>
              <p className="text-sm sm:text-base text-gray-600 text-center mt-2">Your application (Ref: <span className="font-bold">{submissionData?.referenceNo}</span>) has been successfully lodged.</p>
            </div>
            <div className="flex flex-col space-y-2 sm:space-y-3">
              <button type="button" onClick={downloadFormAsPdf} className="w-full px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg text-sm sm:text-base hover:bg-red-700 transition-colors flex items-center justify-center"><DownloadIcon /> Download Full Form (PDF)</button>
              <button onClick={goToDocumentUpload} className="w-full px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg text-sm sm:text-base hover:bg-green-700 transition-colors">Upload Supporting Documents (Optional)</button>
              <button onClick={closeConfirmationModal} className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-sm sm:text-base hover:bg-blue-700 transition-colors">Skip Documents & Go Home</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Application Submitted Successfully!"
        message={`Your building permit application has been submitted successfully. Your reference number is: ${submissionData?.referenceNo}. You can track your application status from the homepage.`}
        buttonText="Go to Homepage"
      />
    </div>
  );
};

export default BuildingApplication;