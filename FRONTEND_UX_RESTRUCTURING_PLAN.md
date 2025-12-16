# FRONTEND UX RESTRUCTURING PLAN
## Philippine LGU Building & Occupancy Permit Application System

**Document Version:** 1.0  
**Date:** 2024  
**Purpose:** Frontend-only UX restructuring to mirror real LGU workflow

---

## EXECUTIVE SUMMARY

This document provides a comprehensive plan to restructure the frontend UX of BuildingApplication.jsx and OccupancyApplication.jsx to follow realistic Philippine LGU permit application workflows (New, Renewal, Amendatory) while maintaining 100% backend compatibility.

**KEY PRINCIPLES:**
- FRONTEND-ONLY changes
- Backend payloads remain identical
- PDF generation unchanged
- All existing routes/controllers preserved
- No database schema modifications

---

## TABLE OF CONTENTS

1. Backend Compatibility Verification
2. Current State Analysis
3. New UX Flow Architecture
4. Step-by-Step Implementation Guide
5. State Mapping Reference
6. Code Examples
7. Risk Assessment

---

## 1. BACKEND COMPATIBILITY VERIFICATION

### 1.1 API Endpoints (UNCHANGED)

| Method | Endpoint | Controller | Required Payload |
|--------|----------|------------|------------------|
| POST | /api/applications/building | submitBuildingApplication | { box1, box2, box3, box4 } |
| POST | /api/applications/occupancy | submitOccupancyApplication | { buildingPermitIdentifier, permitInfo, ownerDetails, requirementsSubmitted, otherDocs, projectDetails, signatures } |
| GET | /api/applications/track/:referenceNo | getApplicationByReferenceNo | N/A |
| POST | /api/applications/:id/upload-documents | uploadSupportingDocuments | { requirementName, file } |
| POST | /api/applications/:id/upload-payment | uploadPaymentProof | { method, referenceNumber, file } |

**VERIFICATION STATUS:** All endpoints remain unchanged. Frontend will continue sending identical payload structures.

### 1.2 Building Application Payload Structure (UNCHANGED)

```javascript
// Current payload structure - MUST BE PRESERVED
const payload = {
  box1: {
    owner: { lastName, firstName, middleInitial, tin },
    enterprise: {
      formOfOwnership,
      projectTitle,
      address: { no, street, barangay, city, zip, telNo }
    },
    location: { lotNo, blkNo, tctNo, taxDecNo, street, barangay, city },
    scopeOfWork: [], // Array of strings
    occupancy: { group, classified },
    projectDetails: {
      numberOfUnits,
      totalEstimatedCost,
      totalFloorArea,
      lotArea,
      proposedConstruction,
      expectedCompletion
    }
  },
  box2: { name, date, address, prcNo, validity, ptrNo, ptrDate, issuedAt, tin },
  box3: { name, date, address, ctcNo, dateIssued, placeIssued },
  box4: { name, date, address, tctNo, taxDecNo, placeIssued }
};
```

### 1.3 Occupancy Application Payload Structure (UNCHANGED)

```javascript
const payload = {
  buildingPermitIdentifier: '', // Reference number or ID
  permitInfo: {
    buildingPermitNo,
    buildingPermitDate,
    fsecNo,
    fsecDate
  },
  ownerDetails: {
    lastName,
    givenName,
    middleInitial,
    address,
    zip,
    telNo
  },
  requirementsSubmitted: [], // Array of requirement IDs
  otherDocs: '',
  projectDetails: {
    projectName,
    projectLocation,
    occupancyUse,
    noStoreys,
    noUnits,
    totalFloorArea,
    dateCompletion
  },
  signatures: {
    ownerName,
    ownerCtcNo,
    ownerCtcDate,
    ownerCtcPlace,
    inspectorName,
    engineerName,
    engineerPrcNo,
    engineerPrcValidity,
    engineerPtrNo,
    engineerPtrDate,
    engineerIssuedAt,
    engineerTin,
    engineerCtcNo,
    engineerCtcDate,
    engineerCtcPlace
  }
};
```

### 1.4 PDF Generation (UNCHANGED)

**Building Permit PDF Fields:**
- Template: `/public/building_permit_form_fillable.pdf`
- All PDF field names remain mapped to box1, box2, box3, box4 structure
- PDF generation function: `downloadFormAsPdf()` - PRESERVED AS-IS

**Occupancy Permit PDF Fields:**
- Template: `/public/certificate_of_occupancy_form.pdf`
- All PDF field mappings preserved
- No changes to field names or structure

**CRITICAL:** PDF field mapping must remain unchanged to ensure government forms are filled correctly.

---

## 2. CURRENT STATE ANALYSIS

### 2.1 BuildingApplication.jsx - Current Structure

**Current Flow:**
- Step 1: Applicant & Project (all box1 fields)
- Step 2: Authorization & Signatures (box2, box3, box4)

**State Variables:**
```javascript
const [currentStep, setCurrentStep] = useState(1);
const [box1, setBox1] = useState({ owner, enterprise, location, scopeOfWork, occupancy, projectDetails });
const [box2, setBox2] = useState({ /* architect/engineer */ });
const [box3, setBox3] = useState({ /* applicant signature */ });
const [box4, setBox4] = useState({ /* lot owner */ });
```

**Issues with Current UX:**
1. No way to distinguish New vs Renewal vs Amendatory applications
2. No pre-application setup or project complexity selection
3. Form fields are not contextually organized
4. No data prefilling for renewal/amendatory cases
5. Single-page approach doesn't match real LGU workflow

### 2.2 OccupancyApplication.jsx - Current Structure

**Current Flow:**
- Single form with all sections visible
- applicationKind (FULL/PARTIAL) shown as checkboxes

**State Variables:**
```javascript
const [formData, setFormData] = useState({
  applicationKind: 'FULL',
  buildingPermitReferenceNo: '',
  permitInfo: { ... },
  ownerDetails: { ... },
  requirementsSubmitted: [],
  otherDocs: '',
  projectDetails: { ... },
  signatures: { ... }
});
```

**Issues with Current UX:**
1. No application type selection (New/Renewal)
2. buildingPermitReferenceNo is just a text field, no lookup
3. No data prefilling from existing building permits
4. All fields shown at once (overwhelming)

---

## 3. NEW UX FLOW ARCHITECTURE

### 3.1 Overview - Activity-Based Workflow

**NEW FLOW FOR BOTH APPLICATIONS:**

```
STEP 0: Application Setup (NEW)
   ↓
   ├─→ New Application → Empty Form
   ├─→ Renewal → Lookup & Prefill → Edit Form
   └─→ Amendatory → Lookup & Prefill → Edit Form (with notice)
   ↓
STEP 1: Applicant & Project Overview
   ↓
STEP 2: Professional Information & Signatures
   ↓
STEP 3: Requirements Checklist
   ↓
STEP 4: Document Upload (existing DocumentUpload.jsx)
   ↓
STEP 5: Payment (existing PaymentPage.jsx)
   ↓
STEP 6: Review & Submit
```

### 3.2 STEP 0: Application Setup (NEW SCREEN)

**Purpose:** Pre-application configuration before showing form fields

**UI Design:**
```jsx
<div className="application-setup">
  <h1>Building Permit Application Setup</h1>
  
  <section>
    <h2>1. Project Complexity</h2>
    <div className="radio-group">
      <label>
        <input type="radio" name="complexity" value="simple" />
        <div>
          <strong>Simple</strong>
          <p>Residential, small repairs, minor alterations</p>
        </div>
      </label>
      <label>
        <input type="radio" name="complexity" value="complex" />
        <div>
          <strong>Complex</strong>
          <p>Commercial, multi-story, structural changes</p>
        </div>
      </label>
    </div>
  </section>

  <section>
    <h2>2. Application Type</h2>
    <div className="radio-group">
      <label>
        <input type="radio" name="applicationType" value="new" />
        <div>
          <strong>New Application</strong>
          <p>First-time application for this project</p>
        </div>
      </label>
      <label>
        <input type="radio" name="applicationType" value="renewal" />
        <div>
          <strong>Renewal</strong>
          <p>Renew expired or expiring building permit</p>
        </div>
      </label>
      <label>
        <input type="radio" name="applicationType" value="amendatory" />
        <div>
          <strong>Amendatory</strong>
          <p>Modify existing approved permit</p>
        </div>
      </label>
    </div>
  </section>

  {/* Conditional: Show if Renewal or Amendatory */}
  {(applicationType === 'renewal' || applicationType === 'amendatory') && (
    <section>
      <h2>3. Existing Permit Reference</h2>
      <input 
        type="text" 
        placeholder="Enter Building Permit Reference No."
        value={existingPermitRef}
        onChange={handlePermitRefChange}
      />
      <button onClick={fetchExistingApplication}>
        Lookup Application
      </button>
    </section>
  )}

  <button 
    onClick={proceedToForm}
    disabled={!complexity || !applicationType}
  >
    Continue to Application Form
  </button>
</div>
```

**State Management for Step 0:**
```javascript
const [setupData, setSetupData] = useState({
  projectComplexity: '', // 'simple' | 'complex'
  applicationType: '', // 'new' | 'renewal' | 'amendatory'
  existingPermitRef: '', // For renewal/amendatory
  isSetupComplete: false
});
```

**Logic for Renewal/Amendatory:**
```javascript
const fetchExistingApplication = async () => {
  try {
    const response = await axios.get(
      `/api/applications/track/${setupData.existingPermitRef}`,
      { headers: { Authorization: `Bearer ${auth.accessToken}` }}
    );
    
    const existingApp = response.data.application;
    
    // Prefill all state with existing data
    setBox1(existingApp.box1);
    setBox2(existingApp.box2);
    setBox3(existingApp.box3);
    setBox4(existingApp.box4);
    
    // Show success message
    if (setupData.applicationType === 'amendatory') {
      alert('Application data loaded. Please update only the fields that have changed.');
    } else {
      alert('Renewal data loaded. Please review and update as needed.');
    }
    
    setSetupData(prev => ({ ...prev, isSetupComplete: true }));
  } catch (error) {
    alert('Could not find application. Please check the reference number.');
  }
};
```

---

## 4. STEP-BY-STEP IMPLEMENTATION GUIDE

### 4.1 STEP 1: Applicant & Project Overview (Restructured box1)

**NEW ORGANIZATION:**

**Section 1.1: Applicant Information**
- Owner/Applicant Name (lastName, firstName, middleInitial)
- TIN
- Ownership Proof (NEW: Radio button)
  - ○ I own the lot (default)
  - ○ I have consent from lot owner
- If "consent": Show file upload for authorization letter

**Section 1.2: Enterprise Details (Conditional)**
- Form of Ownership (CHANGED: Dropdown instead of text)
  - Options: Individual, Corporation, Partnership, Cooperative, Others
  - If "Others": Show text input
- Project Title
- Enterprise Address (no, street, barangay, city, zip, telNo)

**Section 1.3: Location of Construction**
- Lot No., Block No.
- TCT No., Tax Declaration No.
- Street, Barangay, City

**Section 1.4: Scope of Work**
- CHANGED: Checkboxes with better labels
  - ☐ New Construction
  - ☐ Erection
  - ☐ Addition
  - ☐ Alteration
  - ☐ Renovation
  - ☐ Conversion
  - ☐ Repair
  - ☐ Moving
  - ☐ Raising
  - ☐ Accessory Building/Structure
  - ☐ Others (specify): _______

**Section 1.5: Occupancy Classification**
- Group (Radio buttons or Dropdown)
  - Group A through J, Others
- Classified As: (text field)

**Section 1.6: Project Details**
- Number of Units
- Total Estimated Cost
- Total Floor Area
- Lot Area
- Proposed Date of Construction
- Expected Date of Completion

**State Mapping (UNCHANGED):**
```javascript
// All fields still map to box1
setBox1({
  owner: { lastName, firstName, middleInitial, tin },
  enterprise: { formOfOwnership, projectTitle, address: {...} },
  location: { lotNo, blkNo, tctNo, taxDecNo, street, barangay, city },
  scopeOfWork: ['new', 'renovation'], // Array of selected values
  occupancy: { group: 'group_a', classified: 'Residential' },
  projectDetails: { numberOfUnits, totalEstimatedCost, ... }
});
```

**CRITICAL:** Even though UI shows improved inputs (dropdowns, radios), the final values stored in state must remain identical to current structure.

---

### 4.2 STEP 2: Professional Information & Signatures (box2, box3, box4)

**NO MAJOR CHANGES** - Keep existing structure but improve labels:

**Section 2.1: Architect/Engineer Information (box2)**
- Keep disabled/read-only (to be filled by professionals)
- All fields remain unchanged

**Section 2.2: Applicant Signature (box3)**
- Name (signature line)
- Date
- Address
- CTC No., Date Issued, Place Issued

**Section 2.3: Lot Owner Consent (box4)**
- Name (signature line)
- Date
- Address
- TCT No., Tax Declaration No., Place Issued

**State Mapping (UNCHANGED):**
```javascript
// box2, box3, box4 remain identical
setBox2({ name, date, address, prcNo, validity, ptrNo, ptrDate, issuedAt, tin });
setBox3({ name, date, address, ctcNo, dateIssued, placeIssued });
setBox4({ name, date, address, tctNo, taxDecNo, placeIssued });
```

---

### 4.3 STEP 3: Requirements Checklist (NEW - Frontend Only)

**Purpose:** Allow applicants to self-check requirements before document upload

**UI Design:**
```jsx
<div className="requirements-checklist">
  <h2>3. Requirements Checklist</h2>
  <p>Please indicate which documents you have prepared:</p>
  
  <div className="checklist">
    {requirementsList.map(req => (
      <label key={req.id}>
        <input 
          type="checkbox" 
          value={req.id}
          checked={checkedRequirements.includes(req.id)}
          onChange={handleChecklistChange}
        />
        <span>{req.label}</span>
      </label>
    ))}
  </div>
  
  <div>
    <label>Others (specify):</label>
    <input 
      type="text" 
      value={otherRequirements}
      onChange={(e) => setOtherRequirements(e.target.value)}
    />
  </div>
</div>
```

**Requirements List:**
```javascript
const buildingPermitRequirements = [
  { id: 'lot_title', label: 'Certificate of Land Title / Tax Declaration' },
  { id: 'site_plan', label: 'Site Development Plan' },
  { id: 'arch_plans', label: 'Architectural Plans (Floor, Elevation, Section)' },
  { id: 'struct_plans', label: 'Structural Plans & Design' },
  { id: 'electrical', label: 'Electrical Plans' },
  { id: 'plumbing', label: 'Plumbing Plans' },
  { id: 'sanitary', label: 'Sanitary/Septic Plans' },
  { id: 'mechanical', label: 'Mechanical Plans (if applicable)' },
  { id: 'fire_safety', label: 'Fire Safety Evaluation Clearance' },
  { id: 'location_clearance', label: 'Barangay Location Clearance' },
  { id: 'zoning', label: 'Zoning Clearance' },
  { id: 'lot_owner_consent', label: 'Lot Owner Consent (if not owner)' }
];
```

**State (Frontend Only - Not Submitted to Backend):**
```javascript
const [checkedRequirements, setCheckedRequirements] = useState([]);
const [otherRequirements, setOtherRequirements] = useState('');
```

**NOTE:** This checklist is for UX purposes only. It does NOT affect the backend payload. Actual document uploads happen in Step 4.

---

### 4.4 STEP 4: Document Upload (Use Existing Component)

**Integration:** Navigate to existing `DocumentUpload.jsx` component after submission

```javascript
// After successful submission in Step 6
navigate(`/application/documents/${submissionData.applicationId}`, {
  state: { 
    applicationData: submissionData,
    checklist: checkedRequirements // Pass checklist for reference
  }
});
```

**NO CHANGES NEEDED** to DocumentUpload.jsx - it already handles document uploads correctly.

---

### 4.5 STEP 5: Payment (Use Existing Component)

**Integration:** Navigate to existing `PaymentPage.jsx` after document upload

```javascript
navigate(`/application/payment/${applicationId}`, {
  state: { applicationData }
});
```

**NO CHANGES NEEDED** to PaymentPage.jsx.

---

### 4.6 STEP 6: Review & Submit (Enhanced)

**Purpose:** Final review before submission

**UI Design:**
```jsx
<div className="review-submit">
  <h2>Review Your Application</h2>
  
  {/* Application Type Badge */}
  <div className="application-type-badge">
    {setupData.applicationType === 'new' && <span>New Application</span>}
    {setupData.applicationType === 'renewal' && <span>Renewal Application</span>}
    {setupData.applicationType === 'amendatory' && <span>Amendatory Application</span>}
  </div>
  
  {/* Summary Sections */}
  <section>
    <h3>Applicant Information</h3>
    <p>Name: {box1.owner.firstName} {box1.owner.lastName}</p>
    <p>TIN: {box1.owner.tin}</p>
  </section>
  
  <section>
    <h3>Project Information</h3>
    <p>Title: {box1.enterprise.projectTitle}</p>
    <p>Location: {box1.location.street}, {box1.location.barangay}</p>
    <p>Scope: {box1.scopeOfWork.join(', ')}</p>
  </section>
  
  <section>
    <h3>Signatures</h3>
    <p>Applicant: {box3.name}</p>
    <p>Lot Owner: {box4.name}</p>
  </section>
  
  {/* Amendatory Warning */}
  {setupData.applicationType === 'amendatory' && (
    <div className="warning-box">
      <strong>Amendatory Application Notice:</strong>
      <p>You are filing an amendatory application. The system will record this as a modification to your original permit.</p>
    </div>
  )}
  
  <div className="actions">
    <button onClick={() => setCurrentStep(currentStep - 1)}>
      Back to Edit
    </button>
    <button onClick={handleFinalSubmit} disabled={loading}>
      {loading ? 'Submitting...' : 'Submit Application'}
    </button>
  </div>
</div>
```

**Submit Handler (UNCHANGED):**
```javascript
const handleFinalSubmit = async () => {
  setLoading(true);
  
  // Same payload structure as before
  const payload = {
    box1: {
      owner: {
        lastName: box1.owner.lastName,
        firstName: box1.owner.firstName,
        middleInitial: box1.owner.middleInitial,
        tin: toNum(box1.owner.tin)
      },
      enterprise: {
        formOfOwnership: box1.enterprise.formOfOwnership,
        projectTitle: box1.enterprise.projectTitle,
        address: {
          no: toNum(box1.enterprise.address.no),
          street: box1.enterprise.address.street,
          barangay: box1.enterprise.address.barangay,
          city: box1.enterprise.address.city,
          zip: toNum(box1.enterprise.address.zip),
          telNo: toNum(box1.enterprise.address.telNo)
        }
      },
      location: {
        ...box1.location,
        blkNo: toNum(box1.location.blkNo),
        tctNo: toNum(box1.location.tctNo),
        taxDecNo: toNum(box1.location.taxDecNo)
      },
      scopeOfWork: box1.scopeOfWork,
      occupancy: box1.occupancy,
      projectDetails: {
        ...box1.projectDetails,
        numberOfUnits: toNum(box1.projectDetails.numberOfUnits),
        totalEstimatedCost: toNum(box1.projectDetails.totalEstimatedCost),
        totalFloorArea: toNum(box1.projectDetails.totalFloorArea),
        lotArea: toNum(box1.projectDetails.lotArea)
      }
    },
    box2: {
      ...box2,
      prcNo: toNum(box2.prcNo),
      ptrNo: toNum(box2.ptrNo),
      tin: toNum(box2.tin)
    },
    box3: {
      ...box3,
      ctcNo: toNum(box3.ctcNo)
    },
    box4: {
      ...box4,
      tctNo: toNum(box4.tctNo),
      taxDecNo: toNum(box4.taxDecNo)
    }
  };
  
  try {
    const response = await axios.post('/api/applications/building', payload, {
      headers: { Authorization: `Bearer ${auth.accessToken}` }
    });
    
    // Show success and navigate
    setSubmissionData(response.data);
    setShowConfirmationModal(true);
  } catch (error) {
    console.error('Submission failed:', error);
    alert('Submission failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

---

## 5. OCCUPANCY APPLICATION RESTRUCTURING

### 5.1 STEP 0: Application Setup (Occupancy)

**Differences from Building Application:**

```jsx
<div className="occupancy-setup">
  <h1>Certificate of Occupancy Application Setup</h1>
  
  <section>
    <h2>1. Occupancy Type</h2>
    <div className="radio-group">
      <label>
        <input type="radio" name="occupancyKind" value="FULL" />
        <div>
          <strong>Full Occupancy</strong>
          <p>Entire building/structure is complete</p>
        </div>
      </label>
      <label>
        <input type="radio" name="occupancyKind" value="PARTIAL" />
        <div>
          <strong>Partial Occupancy</strong>
          <p>Only specific portions are complete</p>
        </div>
      </label>
    </div>
  </section>

  <section>
    <h2>2. Application Type</h2>
    <div className="radio-group">
      <label>
        <input type="radio" name="applicationType" value="new" />
        <strong>New Application</strong>
      </label>
      <label>
        <input type="radio" name="applicationType" value="renewal" />
        <strong>Renewal</strong>
      </label>
    </div>
  </section>

  <section>
    <h2>3. Building Permit Reference</h2>
    <input 
      type="text" 
      placeholder="Enter Building Permit Reference No."
      value={buildingPermitRef}
      onChange={handleBuildingPermitRefChange}
    />
    <button onClick={fetchBuildingPermit}>
      Lookup Building Permit
    </button>
  </section>
</div>
```

**State for Setup:**
```javascript
const [setupData, setSetupData] = useState({
  occupancyKind: '', // 'FULL' | 'PARTIAL'
  applicationType: '', // 'new' | 'renewal'
  buildingPermitRef: '',
  buildingPermitData: null, // Fetched building permit
  isSetupComplete: false
});
```

**Lookup Logic:**
```javascript
const fetchBuildingPermit = async () => {
  try {
    const response = await axios.get(
      `/api/applications/track/${setupData.buildingPermitRef}`,
      { headers: { Authorization: `Bearer ${auth.accessToken}` }}
    );
    
    const buildingApp = response.data.application;
    
    // Prefill relevant data from building permit
    setFormData(prev => ({
      ...prev,
      buildingPermitIdentifier: buildingApp.referenceNo,
      permitInfo: {
        buildingPermitNo: buildingApp.permit?.permitNumber || '',
        buildingPermitDate: buildingApp.permit?.issuedAt || '',
        fsecNo: '',
        fsecDate: ''
      },
      ownerDetails: {
        lastName: buildingApp.box1.owner.lastName,
        givenName: buildingApp.box1.owner.firstName,
        middleInitial: buildingApp.box1.owner.middleInitial,
        address: buildingApp.box3.address || '',
        zip: buildingApp.box1.enterprise.address.zip || '',
        telNo: buildingApp.box1.enterprise.address.telNo || ''
      },
      projectDetails: {
        projectName: buildingApp.box1.enterprise.projectTitle || '',
        projectLocation: `${buildingApp.box1.location.street}, ${buildingApp.box1.location.barangay}`,
        occupancyUse: buildingApp.box1.occupancy.classified || '',
        noStoreys: '',
        noUnits: buildingApp.box1.projectDetails.numberOfUnits || '',
        totalFloorArea: buildingApp.box1.projectDetails.totalFloorArea || '',
        dateCompletion: ''
      }
    }));
    
    setSetupData(prev => ({ 
      ...prev, 
      buildingPermitData: buildingApp,
      isSetupComplete: true 
    }));
    
    alert('Building permit data loaded successfully!');
  } catch (error) {
    alert('Could not find building permit. Please check the reference number.');
  }
};
```

### 5.2 Occupancy Application Steps

**STEP 1: Permit Information**
- Building Permit No. (prefilled)
- Building Permit Date (prefilled)
- FSEC No.
- FSEC Date

**STEP 2: Owner/Permittee Details**
- Last Name, Given Name, M.I. (prefilled from building permit)
- Address (prefilled)
- Zip Code, Tel No.

**STEP 3: Requirements Checklist**
```javascript
const occupancyRequirements = [
  { id: 'req_permit', label: 'Copy of Building Permit' },
  { id: 'req_logbook', label: 'Construction Logbook' },
  { id: 'req_photos', label: 'Photographs (Before, During, After)' },
  { id: 'req_completion', label: 'Certificate of Completion' },
  { id: 'req_asbuilt', label: 'As-Built Plans' },
  { id: 'req_fsec', label: 'FSEC/Fire Safety Inspection Certificate' }
];
```

**STEP 4: Project Details**
- Name of Project (prefilled)
- Project Location (prefilled)
- Use/Character of Occupancy (prefilled)
- No. of Storeys
- No. of Units (prefilled)
- Total Floor Area (prefilled)
- Date of Completion

**STEP 5: Certification & Signatures**
- Owner/Permittee signature
- Inspector name
- Architect/Engineer signature

**STEP 6: Review & Submit**

**State Mapping (UNCHANGED):**
```javascript
// Payload remains identical
const payload = {
  buildingPermitIdentifier: formData.buildingPermitIdentifier,
  permitInfo: formData.permitInfo,
  ownerDetails: formData.ownerDetails,
  requirementsSubmitted: formData.requirementsSubmitted,
  otherDocs: formData.otherDocs,
  projectDetails: formData.projectDetails,
  signatures: formData.signatures
};
```

---

## 6. STATE MAPPING REFERENCE

### 6.1 Building Application - Complete State Mapping

| UI Section | State Variable | Backend Field | Notes |
|------------|---------------|---------------|-------|
| **STEP 0: Setup** | | | |
| Project Complexity | setupData.projectComplexity | N/A | Frontend only |
| Application Type | setupData.applicationType | N/A | Frontend only |
| Existing Permit Ref | setupData.existingPermitRef | N/A | For lookup only |
| **STEP 1: Applicant & Project** | | | |
| Owner Last Name | box1.owner.lastName | box1.owner.lastName | Required |
| Owner First Name | box1.owner.firstName | box1.owner.firstName | Required |
| Owner M.I. | box1.owner.middleInitial | box1.owner.middleInitial | Optional |
| Owner TIN | box1.owner.tin | box1.owner.tin | Number |
| Form of Ownership | box1.enterprise.formOfOwnership | box1.enterprise.formOfOwnership | Dropdown → String |
| Project Title | box1.enterprise.projectTitle | box1.enterprise.projectTitle | String |
| Enterprise Address | box1.enterprise.address.* | box1.enterprise.address.* | Object |
| Location Details | box1.location.* | box1.location.* | Object |
| Scope of Work | box1.scopeOfWork | box1.scopeOfWork | Array of strings |
| Occupancy Group | box1.occupancy.group | box1.occupancy.group | String |
| Occupancy Classified | box1.occupancy.classified | box1.occupancy.classified | String |
| Project Details | box1.projectDetails.* | box1.projectDetails.* | Object |
| **STEP 2: Professional Info** | | | |
| Architect/Engineer | box2.* | box2.* | Object (disabled) |
| Applicant Signature | box3.* | box3.* | Object |
| Lot Owner | box4.* | box4.* | Object |
| **STEP 3: Checklist** | | | |
| Requirements Checklist | checkedRequirements | N/A | Frontend only |
| Other Requirements | otherRequirements | N/A | Frontend only |

### 6.2 Occupancy Application - Complete State Mapping

| UI Section | State Variable | Backend Field | Notes |
|------------|---------------|---------------|-------|
| **STEP 0: Setup** | | | |
| Occupancy Kind | setupData.occupancyKind | formData.applicationKind | FULL/PARTIAL |
| Application Type | setupData.applicationType | N/A | Frontend only |
| Building Permit Ref | setupData.buildingPermitRef | formData.buildingPermitIdentifier | For lookup |
| **STEP 1: Permit Info** | | | |
| Building Permit No. | formData.permitInfo.buildingPermitNo | permitInfo.buildingPermitNo | Prefilled |
| Building Permit Date | formData.permitInfo.buildingPermitDate | permitInfo.buildingPermitDate | Prefilled |
| FSEC No. | formData.permitInfo.fsecNo | permitInfo.fsecNo | Required |
| FSEC Date | formData.permitInfo.fsecDate | permitInfo.fsecDate | Required |
| **STEP 2: Owner Details** | | | |
| Owner Name | formData.ownerDetails.* | ownerDetails.* | Prefilled from building permit |
| **STEP 3: Requirements** | | | |
| Requirements List | formData.requirementsSubmitted | requirementsSubmitted | Array of IDs |
| Other Docs | formData.otherDocs | otherDocs | String |
| **STEP 4: Project Details** | | | |
| Project Info | formData.projectDetails.* | projectDetails.* | Mostly prefilled |
| **STEP 5: Signatures** | | | |
| Signatures | formData.signatures.* | signatures.* | Object |

---

## 7. IMPLEMENTATION CODE EXAMPLES

### 7.1 BuildingApplication.jsx - New Structure

```jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { PDFDocument } from 'pdf-lib';
import SuccessModal from '../components/modals/confirmation/SuccessModal';

const BuildingApplication = () => {
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for setup
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  // STEP 0: Setup State (NEW)
  const [setupData, setSetupData] = useState({
    projectComplexity: '', // 'simple' | 'complex'
    applicationType: '', // 'new' | 'renewal' | 'amendatory'
    existingPermitRef: '',
    isSetupComplete: false
  });

  // Existing state (UNCHANGED)
  const [box1, setBox1] = useState({
    owner: { lastName: '', firstName: '', middleInitial: '', tin: '' },
    enterprise: {
      formOfOwnership: '',
      projectTitle: '',
      address: { no: '', street: '', barangay: '', city: '', zip: '', telNo: '' }
    },
    location: {
      lotNo: '', blkNo: '', tctNo: '', taxDecNo: '',
      street: '', barangay: '', city: ''
    },
    scopeOfWork: [],
    occupancy: { group: '', classified: '' },
    projectDetails: {
      numberOfUnits: '', totalEstimatedCost: '', totalFloorArea: '',
      lotArea: '', proposedConstruction: '', expectedCompletion: ''
    }
  });

  const [box2, setBox2] = useState({
    name: '', date: '', address: '', prcNo: '', validity: '',
    ptrNo: '', ptrDate: '', issuedAt: '', tin: ''
  });

  const [box3, setBox3] = useState({
    name: '', date: '', address: '', ctcNo: '', dateIssued: '', placeIssued: ''
  });

  const [box4, setBox4] = useState({
    name: '', date: '', address: '', tctNo: '', taxDecNo: '', placeIssued: ''
  });

  // NEW: Checklist state (frontend only)
  const [checkedRequirements, setCheckedRequirements] = useState([]);
  const [otherRequirements, setOtherRequirements] = useState('');

  // STEP 0: Fetch existing application for renewal/amendatory
  const fetchExistingApplication = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/applications/track/${setupData.existingPermitRef}`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` }}
      );
      
      const existing = response.data.application;
      
      // Prefill all state
      setBox1(existing.box1);
      setBox2(existing.box2);
      setBox3(existing.box3);
      setBox4(existing.box4);
      
      if (setupData.applicationType === 'amendatory') {
        alert('✓ Application data loaded. Update only the fields that changed.');
      } else {
        alert('✓ Renewal data loaded. Please review and update as needed.');
      }
      
      // Move to Step 1
      setCurrentStep(1);
      setSetupData(prev => ({ ...prev, isSetupComplete: true }));
    } catch (error) {
      alert('Application not found. Please check the reference number.');
    } finally {
      setLoading(false);
    }
  };

  const proceedToForm = () => {
    if (setupData.applicationType === 'new') {
      // Start with empty form
      setCurrentStep(1);
      setSetupData(prev => ({ ...prev, isSetupComplete: true }));
    } else {
      // Must fetch existing data first
      if (!setupData.existingPermitRef) {
        alert('Please enter the Building Permit Reference Number.');
        return;
      }
      fetchExistingApplication();
    }
  };

  // Existing handlers (UNCHANGED)
  const handleOwnerChange = (e) =>
    setBox1(prev => ({ ...prev, owner: { ...prev.owner, [e.target.name]: e.target.value }}));

  const handleEnterpriseChange = (e) =>
    setBox1(prev => ({ ...prev, enterprise: { ...prev.enterprise, [e.target.name]: e.target.value }}));
  
  // ... (all other handlers remain unchanged)

  // UNCHANGED: Submit handler
  const handleFinalSubmit = async () => {
    setLoading(true);
    
    const toNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const payload = {
      box1: {
        owner: {
          lastName: box1.owner.lastName,
          firstName: box1.owner.firstName,
          middleInitial: box1.owner.middleInitial,
          tin: toNum(box1.owner.tin)
        },
        enterprise: {
          formOfOwnership: box1.enterprise.formOfOwnership,
          projectTitle: box1.enterprise.projectTitle,
          address: {
            no: toNum(box1.enterprise.address.no),
            street: box1.enterprise.address.street,
            barangay: box1.enterprise.address.barangay,
            city: box1.enterprise.address.city,
            zip: toNum(box1.enterprise.address.zip),
            telNo: toNum(box1.enterprise.address.telNo)
          }
        },
        location: {
          ...box1.location,
          blkNo: toNum(box1.location.blkNo),
          tctNo: toNum(box1.location.tctNo),
          taxDecNo: toNum(box1.location.taxDecNo)
        },
        scopeOfWork: box1.scopeOfWork,
        occupancy: box1.occupancy,
        projectDetails: {
          ...box1.projectDetails,
          numberOfUnits: toNum(box1.projectDetails.numberOfUnits),
          totalEstimatedCost: toNum(box1.projectDetails.totalEstimatedCost),
          totalFloorArea: toNum(box1.projectDetails.totalFloorArea),
          lotArea: toNum(box1.projectDetails.lotArea)
        }
      },
      box2: {
        ...box2,
        prcNo: toNum(box2.prcNo),
        ptrNo: toNum(box2.ptrNo),
        tin: toNum(box2.tin)
      },
      box3: {
        ...box3,
        ctcNo: toNum(box3.ctcNo)
      },
      box4: {
        ...box4,
        tctNo: toNum(box4.tctNo),
        taxDecNo: toNum(box4.taxDecNo)
      }
    };

    try {
      const response = await axios.post('/api/applications/building', payload, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });

      setSubmissionData({
        referenceNo: response.data.referenceNo,
        applicationId: response.data.applicationId,
        ownerName: `${box1.owner.firstName} ${box1.owner.lastName}`,
        projectTitle: box1.enterprise.projectTitle || 'N/A',
        location: `${box1.location.street}, ${box1.location.barangay}, ${box1.location.city}`,
        archEngName: box2.name,
        scopeList: box1.scopeOfWork.join(', ')
      });

      setShowConfirmationModal(true);
    } catch (err) {
      console.error('Submission failed:', err);
      alert(`Submission Error: ${err.response?.data?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // UNCHANGED: PDF generation
  const downloadFormAsPdf = async () => {
    // ... (keep existing PDF generation code exactly as-is)
  };

  return (
    <div className="antialiased text-gray-800 bg-gray-100 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-5xl mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg">
          
          {/* STEP 0: Application Setup */}
          {currentStep === 0 && (
            <div className="application-setup">
              <h1 className="text-2xl font-bold mb-6 text-center">
                Building Permit Application Setup
              </h1>
              
              {/* Project Complexity */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Project Complexity</h2>
                <div className="space-y-3">
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="radio"
                      name="complexity"
                      value="simple"
                      checked={setupData.projectComplexity === 'simple'}
                      onChange={(e) => setSetupData(prev => ({ ...prev, projectComplexity: e.target.value }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <strong className="text-lg">Simple</strong>
                      <p className="text-gray-600">Residential, small repairs, minor alterations</p>
                    </div>
                  </label>
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="radio"
                      name="complexity"
                      value="complex"
                      checked={setupData.projectComplexity === 'complex'}
                      onChange={(e) => setSetupData(prev => ({ ...prev, projectComplexity: e.target.value }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <strong className="text-lg">Complex</strong>
                      <p className="text-gray-600">Commercial, multi-story, structural changes</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Application Type */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Application Type</h2>
                <div className="space-y-3">
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="radio"
                      name="applicationType"
                      value="new"
                      checked={setupData.applicationType === 'new'}
                      onChange={(e) => setSetupData(prev => ({ ...prev, applicationType: e.target.value }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <strong className="text-lg">New Application</strong>
                      <p className="text-gray-600">First-time application for this project</p>
                    </div>
                  </label>
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="radio"
                      name="applicationType"
                      value="renewal"
                      checked={setupData.applicationType === 'renewal'}
                      onChange={(e) => setSetupData(prev => ({ ...prev, applicationType: e.target.value }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <strong className="text-lg">Renewal</strong>
                      <p className="text-gray-600">Renew expired or expiring building permit</p>
                    </div>
                  </label>
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="radio"
                      name="applicationType"
                      value="amendatory"
                      checked={setupData.applicationType === 'amendatory'}
                      onChange={(e) => setSetupData(prev => ({ ...prev, applicationType: e.target.value }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <strong className="text-lg">Amendatory</strong>
                      <p className="text-gray-600">Modify existing approved permit</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Conditional: Reference Number for Renewal/Amendatory */}
              {(setupData.applicationType === 'renewal' || setupData.applicationType === 'amendatory') && (
                <section className="mb-8 p-6 bg-blue-50 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">3. Existing Permit Reference</h2>
                  <p className="text-gray-700 mb-4">
                    Enter the reference number of your existing building permit:
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g., B-2301000001"
                      value={setupData.existingPermitRef}
                      onChange={(e) => setSetupData(prev => ({ ...prev, existingPermitRef: e.target.value }))}
                      className="flex-1 px-4 py-2 border rounded-md"
                    />
                  </div>
                </section>
              )}

              {/* Continue Button */}
              <div className="flex justify-center">
                <button
                  onClick={proceedToForm}
                  disabled={!setupData.projectComplexity || !setupData.applicationType || loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                  {loading ? 'Loading...' : 'Continue to Application Form'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 1-6: Existing form structure with improvements */}
          {currentStep >= 1 && (
            <>
              {/* Progress Indicator */}
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3, 4].map(step => (
                  <React.Fragment key={step}>
                    <div className="flex-1 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                        {step}
                      </div>
                      <p className={`mt-2 text-xs ${currentStep >= step ? 'text-blue-600' : 'text-gray-600'}`}>
                        {step === 1 && 'Applicant'}
                        {step === 2 && 'Professional'}
                        {step === 3 && 'Checklist'}
                        {step === 4 && 'Review'}
                      </p>
                    </div>
                    {step < 4 && <div className="flex-1 h-1 bg-gray-200 mx-2"></div>}
                  </React.Fragment>
                ))}
              </div>

              {/* Form steps - keep existing structure but enhanced */}
              {/* ... existing form code ... */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildingApplication;
```

---

## 8. RISK ASSESSMENT & MITIGATION

### 8.1 Backend Compatibility Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Payload structure changes** | HIGH | ✅ All payloads remain identical. State variables map to same backend fields. |
| **PDF generation breaks** | HIGH | ✅ PDF generation function unchanged. All field mappings preserved. |
| **Route/controller modifications** | HIGH | ✅ No backend changes required. Frontend-only restructuring. |
| **Document upload breaks** | MEDIUM | ✅ Using existing DocumentUpload.jsx component. No changes needed. |
| **Payment flow breaks** | MEDIUM | ✅ Using existing PaymentPage.jsx component. No changes needed. |

### 8.2 UX/Frontend Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Renewal/Amendatory lookup fails** | MEDIUM | ✅ Use existing `/api/applications/track/:referenceNo` endpoint. Add error handling. |
| **State prefilling errors** | MEDIUM | ✅ Validate fetched data before prefilling. Provide fallback to empty form. |
| **Step navigation confusion** | LOW | ✅ Clear progress indicator. Allow back navigation. |
| **Form validation complexity** | LOW | ✅ Reuse existing validation logic. Add step-specific validation. |

### 8.3 Testing Checklist

**Before Deployment:**
- [ ] Test NEW application flow (empty form)
- [ ] Test RENEWAL flow (prefill from existing)
- [ ] Test AMENDATORY flow (prefill + notice)
- [ ] Verify backend payload structure unchanged
- [ ] Verify PDF generation produces correct output
- [ ] Test all form validations
- [ ] Test navigation between steps
- [ ] Verify document upload integration
- [ ] Verify payment flow integration
- [ ] Test on mobile/tablet devices
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## 9. IMPLEMENTATION TIMELINE

### Phase 1: Building Application (Week 1-2)
- [ ] Day 1-2: Implement Step 0 (Application Setup)
- [ ] Day 3-4: Restructure Step 1 (Applicant & Project)
- [ ] Day 5-6: Add Step 3 (Requirements Checklist)
- [ ] Day 7-8: Implement Review & Submit (Step 4)
- [ ] Day 9-10: Testing & bug fixes

### Phase 2: Occupancy Application (Week 3)
- [ ] Day 1-2: Implement Step 0 (Occupancy Setup)
- [ ] Day 3-4: Restructure all occupancy steps
- [ ] Day 5: Testing & integration
- [ ] Day 6-7: Bug fixes & refinements

### Phase 3: Polish & Deploy (Week 4)
- [ ] Day 1-2: UI/UX refinements
- [ ] Day 3: Mobile responsiveness
- [ ] Day 4: Cross-browser testing
- [ ] Day 5: Documentation updates
- [ ] Day 6-7: Deployment & monitoring

---

## 10. UI/UX IMPROVEMENTS SUMMARY

### Form Field Enhancements

| Current | Improved | Benefit |
|---------|----------|---------|
| Text input: "Form of Ownership" | Dropdown with options | Standardized data, better validation |
| Checkboxes: scopeOfWork (basic) | Labeled checkboxes with descriptions | Clearer user understanding |
| Hidden occupancy logic | Radio buttons/dropdown for groups | More intuitive selection |
| No checklist | Requirements checklist before upload | Helps users prepare documents |
| Single "Submit" button | Review step before submission | Reduces submission errors |

### Navigation Improvements

| Current | Improved |
|---------|----------|
| 2 steps only | 4-6 contextual steps |
| Linear flow only | Back/forward navigation |
| No application type selection | Setup screen with New/Renewal/Amendatory |
| Manual data entry for renewals | Auto-prefill from existing permits |

### Visual Enhancements

- Progress indicator showing current step
- Application type badge (New/Renewal/Amendatory)
- Conditional field display based on selections
- Warning notices for amendatory applications
- Summary cards in review step
- Better mobile responsiveness

---

## 11. CODE ORGANIZATION

### Recommended File Structure

```
frontend/src/pages/Applications/
├── BuildingApplication.jsx (main component)
├── OccupancyApplication.jsx (main component)
├── components/
│   ├── ApplicationSetup.jsx (Step 0 for both)
│   ├── BuildingSteps/
│   │   ├── ApplicantInfo.jsx (Step 1)
│   │   ├── ProfessionalInfo.jsx (Step 2)
│   │   ├── RequirementsChecklist.jsx (Step 3)
│   │   └── ReviewSubmit.jsx (Step 4)
│   └── OccupancySteps/
│       ├── PermitInfo.jsx
│       ├── OwnerDetails.jsx
│       ├── ProjectDetails.jsx
│       └── Signatures.jsx
└── utils/
    ├── formHelpers.js (toNum, validation)
    └── applicationLookup.js (fetch existing permits)
```

**Alternative:** Keep everything in BuildingApplication.jsx and OccupancyApplication.jsx as conditional renders (current approach).

---

## 12. DROPDOWN/RADIO OPTIONS REFERENCE

### Form of Ownership Options
```javascript
const formOfOwnershipOptions = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Corporation', label: 'Corporation' },
  { value: 'Partnership', label: 'Partnership' },
  { value: 'Cooperative', label: 'Cooperative' },
  { value: 'Government', label: 'Government' },
  { value: 'Others', label: 'Others (Specify)' }
];
```

### Occupancy Group Options
```javascript
const occupancyGroups = [
  { value: 'group_a', label: 'Group A - Assemblies' },
  { value: 'group_b', label: 'Group B - Business' },
  { value: 'group_c', label: 'Group C - Residential' },
  { value: 'group_d', label: 'Group D - Educational' },
  { value: 'group_e', label: 'Group E - Institutional' },
  { value: 'group_f', label: 'Group F - Industrial' },
  { value: 'group_g', label: 'Group G - Storage' },
  { value: 'group_h_load_lt_1000', label: 'Group H - Hazardous (<1000)' },
  { value: 'group_h_load_gt_1000', label: 'Group H - Hazardous (>1000)' },
  { value: 'group_i', label: 'Group I - Mixed Use' },
  { value: 'group_j', label: 'Group J - Accessory' },
  { value: 'others', label: 'Others' }
];
```

### Scope of Work Options
```javascript
const scopeOfWorkOptions = [
  { id: 'new', label: 'New Construction' },
  { id: 'erection', label: 'Erection' },
  { id: 'addition', label: 'Addition' },
  { id: 'alteration', label: 'Alteration' },
  { id: 'renovation', label: 'Renovation' },
  { id: 'conversion', label: 'Conversion' },
  { id: 'repair', label: 'Repair' },
  { id: 'moving', label: 'Moving' },
  { id: 'raising', label: 'Raising' },
  { id: 'accessory', label: 'Accessory Building/Structure' },
  { id: 'others', label: 'Others (Specify)' }
];
```

---

## 13. VALIDATION RULES

### Step 0 Validation
```javascript
const validateSetup = () => {
  const errors = {};
  
  if (!setupData.projectComplexity) {
    errors.complexity = 'Please select project complexity';
  }
  
  if (!setupData.applicationType) {
    errors.applicationType = 'Please select application type';
  }
  
  if ((setupData.applicationType === 'renewal' || setupData.applicationType === 'amendatory') 
      && !setupData.existingPermitRef) {
    errors.permitRef = 'Please enter existing permit reference number';
  }
  
  return Object.keys(errors).length === 0;
};
```

### Step 1 Validation (Existing + Enhanced)
```javascript
const validateStep1 = () => {
  const errors = {};
  
  // Owner validation
  if (!box1.owner.lastName) errors.owner_lastName = 'Last name is required';
  if (!box1.owner.firstName) errors.owner_firstName = 'First name is required';
  
  // Location validation
  if (!box1.location.street) errors.location_street = 'Street is required';
  if (!box1.location.barangay) errors.location_barangay = 'Barangay is required';
  if (!box1.location.city) errors.location_city = 'City is required';
  
  // Scope of work validation
  if (box1.scopeOfWork.length === 0) {
    errors.scopeOfWork = 'Please select at least one scope of work';
  }
  
  // Occupancy validation
  if (!box1.occupancy.group) errors.occupancy_group = 'Please select occupancy group';
  
  // Project details validation
  if (!box1.projectDetails.totalFloorArea) {
    errors.totalFloorArea = 'Total floor area is required';
  }
  
  return errors;
};
```

### Step 2 Validation (Existing)
```javascript
const validateStep2 = () => {
  const errors = {};
  
  // Box 3: Applicant signature
  if (!box3.name) errors.box3_name = 'Applicant name is required';
  if (!box3.date) errors.box3_date = 'Date is required';
  if (!box3.address) errors.box3_address = 'Address is required';
  
  // Box 4: Lot owner
  if (!box4.name) errors.box4_name = 'Lot owner name is required';
  if (!box4.date) errors.box4_date = 'Date is required';
  
  return errors;
};
```

---

## 14. EXAMPLE USER FLOWS

### Flow 1: New Building Permit Application

```
User Journey:
1. Click "Apply for Building Permit" from home
2. STEP 0: Select "Simple" complexity, "New" application type → Click Continue
3. STEP 1: Fill in owner details, project info, location, scope, occupancy
4. Click "Next Step"
5. STEP 2: Fill in applicant signature (Box 3) and lot owner (Box 4)
6. Click "Next Step"
7. STEP 3: Check available requirements from checklist
8. Click "Next Step"
9. STEP 4: Review all entered data → Click "Submit Application"
10. Success modal shows → Option to upload documents or go home
11. Navigate to DocumentUpload.jsx → Upload supporting documents
12. Navigate to PaymentPage.jsx → Submit payment proof
13. Track application status
```

### Flow 2: Renewal Application

```
User Journey:
1. Click "Apply for Building Permit"
2. STEP 0: Select "Complex" complexity, "Renewal" application type
3. Enter existing permit reference: "B-2301000123"
4. Click "Continue"
5. System fetches existing data and prefills all fields
6. Alert: "Renewal data loaded. Please review and update as needed."
7. User reviews prefilled data
8. Update expected completion date
9. Update contact information
10. Proceed through steps 2-4 (mostly prefilled)
11. Submit renewal application
12. New reference number generated (tracks back to original)
```

### Flow 3: Amendatory Application

```
User Journey:
1. Click "Apply for Building Permit"
2. STEP 0: Select "Complex" complexity, "Amendatory" application type
3. Enter existing permit reference: "B-2301000456"
4. Click "Continue"
5. System prefills all data
6. Alert: "You are filing an amendatory application. Update only changed fields."
7. User changes: Scope of Work (adds "Addition")
8. User changes: Total Floor Area (increased)
9. Badge shows "AMENDATORY APPLICATION" throughout form
10. STEP 4 Review shows warning box about amendatory nature
11. Submit → New reference generated with link to original permit
```

---

## 15. ACCESSIBILITY CONSIDERATIONS

### WCAG 2.1 Compliance

**Keyboard Navigation:**
- All form fields accessible via Tab key
- Radio buttons navigable with arrow keys
- Submit buttons have clear focus states

**Screen Reader Support:**
```jsx
<label htmlFor="owner-lastname" className="sr-only">
  Owner Last Name
</label>
<input 
  id="owner-lastname"
  name="lastName" 
  type="text"
  aria-required="true"
  aria-invalid={errors.owner_lastName ? 'true' : 'false'}
  aria-describedby={errors.owner_lastName ? 'error-owner-lastname' : undefined}
/>
{errors.owner_lastName && (
  <span id="error-owner-lastname" className="text-red-600 text-sm" role="alert">
    {errors.owner_lastName}
  </span>
)}
```

**Color Contrast:**
- Error messages: Red #DC2626 on white background (4.5:1 ratio)
- Primary buttons: Blue #2563EB with white text (4.5:1 ratio)
- Progress indicators use both color and icons

**Form Validation:**
- Real-time validation feedback
- Clear error messages
- Summary of errors at top of form
- Focus automatically moves to first error

---

## 16. MOBILE RESPONSIVENESS

### Breakpoint Strategy

```css
/* Tailwind breakpoints used */
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Desktops
xl: 1280px  // Large desktops
```

### Mobile-Specific Adjustments

**Step 0 (Setup):**
- Stack radio button options vertically
- Full-width buttons
- Larger touch targets (min 44x44px)

**Form Steps:**
- Single column layout on mobile
- Collapsible sections for long forms
- Sticky "Next" button at bottom
- Progress indicator adapts to smaller screens

**Review Step:**
- Accordion-style sections
- Expandable/collapsible details
- Large submit button

---

## 17. FINAL CHECKLIST BEFORE IMPLEMENTATION

### Pre-Development
- [ ] Review this document with team
- [ ] Confirm backend endpoints are stable
- [ ] Verify PDF templates are accessible
- [ ] Set up development environment
- [ ] Create feature branch

### Development
- [ ] Implement Step 0 (Application Setup)
- [ ] Add renewal/amendatory lookup logic
- [ ] Restructure Step 1 with improved UX
- [ ] Add requirements checklist (Step 3)
- [ ] Implement review step (Step 4)
- [ ] Add validation for all steps
- [ ] Ensure PDF generation unchanged
- [ ] Test all state mappings
- [ ] Add error handling
- [ ] Implement loading states

### Testing
- [ ] Unit tests for validation functions
- [ ] Integration tests for API calls
- [ ] E2E tests for complete flows
- [ ] Manual testing on all devices
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Load testing (if applicable)

### Documentation
- [ ] Update user guide
- [ ] Update admin manual
- [ ] Add inline code comments
- [ ] Update API documentation (if needed)
- [ ] Create video tutorials (optional)

### Deployment
- [ ] Code review
- [ ] QA approval
- [ ] Staging deployment
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] Monitor for errors
- [ ] Gather user feedback

---

## 18. CONCLUSION

This frontend UX restructuring plan provides a comprehensive roadmap to transform the Building and Occupancy Permit applications into a more realistic, user-friendly LGU workflow system.

### Key Achievements

✅ **100% Backend Compatibility** - No changes to APIs, controllers, or database schemas
✅ **Enhanced User Experience** - Activity-based flow mirrors real LGU processes
✅ **Renewal & Amendatory Support** - Automatic data prefilling reduces user effort
✅ **Improved Data Quality** - Dropdowns and structured inputs reduce errors
✅ **Better Navigation** - Clear progress indicators and step-by-step guidance
✅ **Mobile-Friendly** - Responsive design works on all devices
✅ **Accessible** - WCAG 2.1 compliant for inclusive access

### No Breaking Changes

- PDF generation functions preserved
- Document upload flow unchanged
- Payment workflow unchanged
- All existing routes/controllers intact
- Database schemas untouched
- Existing applications still accessible

### Implementation Priority

**MUST HAVE (MVP):**
- Step 0: Application Setup
- Renewal/Amendatory lookup
- Improved Step 1 organization

**SHOULD HAVE:**
- Requirements checklist
- Enhanced review step
- Better validation messages

**NICE TO HAVE:**
- Dropdown for Form of Ownership
- Radio buttons for Occupancy Groups
- Mobile-optimized layouts

### Support & Maintenance

For questions or issues during implementation:
1. Refer to Section 6 (State Mapping Reference)
2. Check Section 8 (Risk Assessment)
3. Review Section 7 (Code Examples)
4. Test against Section 13 (Validation Rules)

---

**Document End**

*Created for: Philippine LGU MEO/OBO Building & Occupancy Permit System*  
*Version: 1.0*  
*Last Updated: 2024*

---
