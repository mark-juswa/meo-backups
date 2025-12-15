import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from "../../context/AuthContext";
import { PDFDocument } from 'pdf-lib';
import SuccessModal from '../components/modals/confirmation/SuccessModal';

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

  const handleApplicationKind = (kind) => setFormData(prev => ({ ...prev, applicationKind: kind }));

  const handleBuildingPermitRefChange = (e) => setFormData(prev => ({ ...prev, buildingPermitReferenceNo: e.target.value }));

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
    navigate('/?status=occupancy_submitted');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.buildingPermitReferenceNo.trim()) {
      setError('Building permit reference number is required.');
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

  return (
    <div className="antialiased text-gray-800 bg-gray-100">
      <div id="form-container" className="bg-white p-6 md:p-10 max-w-5xl mx-auto my-6 shadow-2xl rounded-xl border-gray-200">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">Occupancy Permit</h1>
          <p className="text-md text-gray-500">Application for Certificate of Occupancy</p>
        </header>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* top application kind */}
          <div className="flex gap-6 items-center">
            <label className="flex items-center space-x-2">
              <input type="radio" name="appKind" checked={formData.applicationKind === 'FULL'} onChange={() => handleApplicationKind('FULL')} />
              <span>FULL</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" name="appKind" checked={formData.applicationKind === 'PARTIAL'} onChange={() => handleApplicationKind('PARTIAL')} />
              <span>PARTIAL</span>
            </label>
          </div>

          {/* Section 1 - Permit info */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b-2 border-indigo-100 pb-2">1. Permit Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">

              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building Permit Reference Number: <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.buildingPermitReferenceNo} 
                onChange={handleBuildingPermitRefChange} 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg" 
                placeholder="Enter your building permit reference number"
                required 
              />
              </div>
             
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">

              {/* Section 1 - Permit info 
              <div>
                <label className="block text-sm font-medium text-gray-700">Building Permit No.:</label>
                <input type="text" name="buildingPermitNo" value={formData.permitInfo.buildingPermitNo} onChange={handlePermitInfoChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg" />
              </div>
            */}

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Issued (Building Permit):</label>
                <input type="date" name="buildingPermitDate" value={formData.permitInfo.buildingPermitDate} onChange={handlePermitInfoChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">FSEC No.:</label>
                <input type="text" name="fsecNo" value={formData.permitInfo.fsecNo} onChange={handlePermitInfoChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Issued (FSEC):</label>
                <input type="date" name="fsecDate" value={formData.permitInfo.fsecDate} onChange={handlePermitInfoChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg" required />
              </div>
            </div>
          </div>

          {/* Section 2 - Owner */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b-2 border-indigo-100 pb-2">2. Owner/Permittee Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" name="lastName" placeholder="Last name" value={formData.ownerDetails.lastName} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded" />
              <input type="text" name="givenName" placeholder="Given name" value={formData.ownerDetails.givenName} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded" />
              <input type="text" name="middleInitial" placeholder="M.I." value={formData.ownerDetails.middleInitial} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <input type="text" name="address" placeholder="Address" value={formData.ownerDetails.address} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded col-span-2" />
              <input type="number" name="zip" placeholder="ZIP" value={formData.ownerDetails.zip} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded" />
              <input type="text" name="telNo" placeholder="Tel No." value={formData.ownerDetails.telNo} onChange={handleOwnerDetailsChange} className="p-2 border border-gray-300 rounded col-span-1" />
            </div>
          </div>

          {/* Section 3 - Requirements */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b-2 border-indigo-100 pb-2">3. Requirements Submitted</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {value: 'req_permit', label: 'Issued Building Permit and Plans (1 set)', id: 'req_building_plans'},
                {value: 'req_logbook', label: 'Construction Logbook, signed and sealed', id: 'req_logbook'},
                {value: 'req_photos', label: 'Photos of Site/Project showing completion', id: 'req_photos'},
                {value: 'req_completion', label: '4 Sets Certificate of Completion', id: 'req_completion'},
                {value: 'req_asbuilt', label: 'As-Built Plans and Specifications', id: 'req_asbuilt'},
                {value: 'req_fsec', label: 'Issued Fire Safety Evaluation Clearance (FSEC)', id: 'req_fsec'}
              ].map(item => (
                <label key={item.value} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                  <input type="checkbox" value={item.value} checked={formData.requirementsSubmitted.includes(item.value)} onChange={handleRequirementsChange} />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm">Other documents (specify):</label>
              <input type="text" name="otherDocs" value={formData.otherDocs} onChange={handleOtherDocsChange} className="mt-1 p-2 border border-gray-300 rounded w-full" />
            </div>
          </div>

          {/* Section 4 - Project */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b-2 border-indigo-100 pb-2">4. Project Details</h2>
            <div>
              <label>Name of Project</label>
              <input required type="text" name="projectName" value={formData.projectDetails.projectName} onChange={handleProjectDetailsChange} className="mt-1 p-2 border border-gray-300 rounded w-full" />
            </div>
            <div>
              <label>Project Location</label>
              <input required type="text" name="projectLocation" value={formData.projectDetails.projectLocation} onChange={handleProjectDetailsChange} className="mt-1 p-2 border border-gray-300 rounded w-full" />
            </div>
            <div>
              <label>Use/Character of Occupancy</label>
              <input required type="text" name="occupancyUse" value={formData.projectDetails.occupancyUse} onChange={handleProjectDetailsChange} className="mt-1 p-2 border border-gray-300 rounded w-full" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input type="number" name="noStoreys" value={formData.projectDetails.noStoreys} onChange={handleProjectDetailsChange} className="p-2 rounded border border-gray-300" placeholder="No. of Storeys" required />
              <input type="number" name="noUnits" value={formData.projectDetails.noUnits} onChange={handleProjectDetailsChange} className="p-2 rounded border border-gray-300" placeholder="No. of Units" />
              <input type="text" name="totalFloorArea" value={formData.projectDetails.totalFloorArea} onChange={handleProjectDetailsChange} className="p-2 rounded border border-gray-300" placeholder="Total Floor Area" />
            </div>
            <div>
              <label>Date of Completion</label>
              <input required type="date" name="dateCompletion" value={formData.projectDetails.dateCompletion} onChange={handleProjectDetailsChange} className="mt-1 p-2 rounded w-full" />
            </div>
          </div>

          {/* Section 5 - Signatures */}
          <div className="mt-12 pt-8 border-t-2 border-gray-300">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">5. Certification and Signatures</h2>
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <div className="text-center">
                <p className="mb-2">Submitted by (Owner / Permittee)</p>
                <input name="ownerName" value={formData.signatures.ownerName} onChange={handleSignaturesChange} className="border border-gray-300 text-center w-full max-w-xs mx-auto p-1" placeholder="Owner name" required />
                <div className="mt-3 space-y-1">
                  <input name="ownerCtcNo" value={formData.signatures.ownerCtcNo} onChange={handleSignaturesChange} placeholder="CTC No." className="block w-full p-1 border border-gray-300 rounded" />
                  <input type="date" name="ownerCtcDate" value={formData.signatures.ownerCtcDate} onChange={handleSignaturesChange} className="block w-full p-1 border border-gray-300 rounded" />
                  <input name="ownerCtcPlace" value={formData.signatures.ownerCtcPlace} onChange={handleSignaturesChange} placeholder="Place Issued" className="block w-full p-1 border border-gray-300 rounded" />
                </div>
              </div>

              <div className="text-center">
                <p className="mb-2">Attested by (Inspector)</p>
                <input name="inspectorName" value={formData.signatures.inspectorName} onChange={handleSignaturesChange} className="border-b-2 text-center w-full max-w-xs mx-auto p-1" placeholder="Inspector name" required />
              </div>

              <div className="text-center">
                <p className="mb-2">Prepared by (Architect / Civil Engineer)</p>
                <input name="engineerName" value={formData.signatures.engineerName} onChange={handleSignaturesChange} className="border-b-2 text-center w-full max-w-xs mx-auto p-1" placeholder="Engineer name" required />
                <div className="mt-3 space-y-1 text-left max-w-sm mx-auto">
                  <input name="engineerPrcNo" value={formData.signatures.engineerPrcNo} onChange={handleSignaturesChange} placeholder="PRC No." className="block w-full p-1 border border-gray-300 rounded" />
                  <input type="date" name="engineerPrcValidity" value={formData.signatures.engineerPrcValidity} onChange={handleSignaturesChange} className="block w-full p-1 border border-gray-300 rounded" />
                  <input name="engineerPtrNo" value={formData.signatures.engineerPtrNo} onChange={handleSignaturesChange} placeholder="PTR No." className="block w-full p-1 border border-gray-300 rounded" />
                  <input type="date" name="engineerPtrDate" value={formData.signatures.engineerPtrDate} onChange={handleSignaturesChange} className="block w-full p-1 border border-gray-300 rounded" />
                  <input name="engineerIssuedAt" value={formData.signatures.engineerIssuedAt} onChange={handleSignaturesChange} placeholder="Issued at" className="block w-full p-1 border border-gray-300 rounded" />
                  <input name="engineerTin" value={formData.signatures.engineerTin} onChange={handleSignaturesChange} placeholder="TIN" className="block w-full p-1 border border-gray-300 rounded" />
                  <input name="engineerCtcNo" value={formData.signatures.engineerCtcNo} onChange={handleSignaturesChange} placeholder="CTC No." className="block w-full p-1 border border-gray-300 rounded" />
                  <input type="date" name="engineerCtcDate" value={formData.signatures.engineerCtcDate} onChange={handleSignaturesChange} className="block w-full p-1 border border-gray-300 rounded" />
                  <input name="engineerCtcPlace" value={formData.signatures.engineerCtcPlace} onChange={handleSignaturesChange} placeholder="CTC Place" className="block w-full p-1 border border-gray-300 rounded" />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8 border-t border-indigo-100">
              <button type="button" onClick={downloadFormAsPdf} className="bg-red-600 text-white px-4 py-2 rounded mr-3">Download Filled PDF</button>
              <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
            {error && <p className="text-red-600 mt-3">{error}</p>}
          </div>
        </form>
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
              <button onClick={goToDocumentUpload} className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg">Upload Supporting Documents (Optional)</button>
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
