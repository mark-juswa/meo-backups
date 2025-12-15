// ApplicationFormView.jsx
import React from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * ApplicationFormView:
 * - Render Building or Occupancy fields read-only
 * - Allow MEO to edit Box5 / Box6 (assessment & fees)
 *
 * Props:
 * - app
 * - assessmentData
 * - onAssessmentChange(box, field, value)
 * - onAddFee, onRemoveFee, newFee, setNewFee
 * - canEditAssessment (boolean)
 */

export default function ApplicationFormView({
  app,
  assessmentData,
  onAssessmentChange,
  onAddFee,
  onRemoveFee,
  newFee,
  setNewFee,
  canEditAssessment = false,
}) {
  const isBuilding = app.applicationType === 'Building' || Boolean(app.box1);
  const isMEO = canEditAssessment;

  if (isBuilding) {
    return (
      <div className="space-y-6">
        <FormSection title="Box 1: Applicant Information (Building)">
          <ReadOnlyField label="Full Name" value={app.box1?.owner ? `${app.box1.owner.lastName}, ${app.box1.owner.firstName}` : 'N/A'} />
          <ReadOnlyField label="Address" value={app.box1?.enterprise?.address?.street || 'N/A'} />
          <ReadOnlyField label="Project Title" value={app.box1?.enterprise?.projectTitle || 'N/A'} />
        </FormSection>

        <FormSection title="Box 2: Project Details">
          <ReadOnlyField label="Scope of Work" value={app.box1?.scopeOfWork?.join(', ') || 'N/A'} />
          <ReadOnlyField label="Occupancy Group" value={app.box1?.occupancy?.group || 'N/A'} />
        </FormSection>

        <AssessmentSection
          title="Box 5: Building Assessment"
          data={assessmentData.box5}
          onChange={(field, val) => onAssessmentChange('box5', field, val)}
          isMEO={isMEO}
        />
        <FeesSection
          title="Box 6: Building Fees"
          data={assessmentData.box6}
          isMEO={isMEO}
          actions={{ onAddFee, onRemoveFee, newFee, setNewFee }}
        />
      </div>
    );
  } else {
    // Occupancy
    return (
      <div className="space-y-6">
        <FormSection title="Permit Information (Occupancy)">
          <ReadOnlyField label="Building Permit No" value={app.permitInfo?.buildingPermitNo || 'N/A'} />
          <ReadOnlyField label="Date Issued" value={app.permitInfo?.buildingPermitDate ? new Date(app.permitInfo.buildingPermitDate).toLocaleDateString() : 'N/A'} />
          <ReadOnlyField label="FSEC No" value={app.permitInfo?.fsecNo || 'N/A'} />
        </FormSection>

        <FormSection title="Owner & Project Details">
          <ReadOnlyField label="Owner Name" value={app.ownerDetails ? `${app.ownerDetails.lastName}, ${app.ownerDetails.givenName}` : 'N/A'} />
          <ReadOnlyField label="Project Name" value={app.projectDetails?.projectName || 'N/A'} />
          <ReadOnlyField label="Location" value={app.projectDetails?.projectLocation || 'N/A'} />
          <ReadOnlyField label="Date Completion" value={app.projectDetails?.dateCompletion ? new Date(app.projectDetails.dateCompletion).toLocaleDateString() : 'N/A'} />
        </FormSection>

        <AssessmentSection title="Occupancy Assessment" data={assessmentData.box5} onChange={(field, val) => onAssessmentChange('box5', field, val)} isMEO={isMEO} />
        <FeesSection title="Occupancy Fees" data={assessmentData.box6} isMEO={isMEO} actions={{ onAddFee, onRemoveFee, newFee, setNewFee }} />
      </div>
    );
  }
}

/* Helper components inside same file for neatness */
const AssessmentSection = ({ title, data, onChange, isMEO }) => (
  <FormSection title={title}>
    <EditableField label="Assessed By" value={data?.assessedBy} onChange={(e) => onChange('assessedBy', e.target.value)} disabled={!isMEO} />
    <EditableField label="Reviewed By" value={data?.reviewedBy} onChange={(e) => onChange('reviewedBy', e.target.value)} disabled={!isMEO} />
    <EditableField label="Noted By" value={data?.notedBy} onChange={(e) => onChange('notedBy', e.target.value)} disabled={!isMEO} />
  </FormSection>
);

const FeesSection = ({ title, data, isMEO, actions }) => (
  <FormSection title={title}>
    <div className="flex items-center space-x-2 mb-2 px-1">
      <div className="flex-1 text-xs font-bold text-gray-500 uppercase">Assessed Fees</div>
      <div className="w-32 text-xs font-bold text-gray-500 uppercase">Amount Due</div>
      {isMEO && <div className="w-16"></div>}
    </div>

    <div className="space-y-2">
      {data?.fees?.map((fee, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input type="text" value={fee.particular} readOnly className="flex-1 p-2 border rounded-md bg-gray-100 text-gray-700" />
          <input type="number" value={fee.amount} readOnly className="w-32 p-2 border rounded-md bg-gray-100 text-gray-700 text-right" />
          {isMEO && (
            <button onClick={() => actions.onRemoveFee(index)} className="p-2 text-red-500 hover:text-red-700" title="Remove Fee">
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}
      {(!data?.fees || data?.fees.length === 0) && <p className="text-sm text-gray-400 italic p-2 text-center bg-gray-50 rounded border border-dashed">No assessed fees added yet.</p>}
    </div>

    {isMEO && (
      <div className="flex items-center space-x-2 pt-4 mt-4 p-3 rounded-lg">
        <input type="text" placeholder="Fee Name (e.g. Filing Fee)" value={actions.newFee.particular} onChange={(e) => actions.setNewFee({ ...actions.newFee, particular: e.target.value })} className="flex-1 p-2 border border-blue-300 rounded-md" />
        <input type="number" placeholder="0.00" value={actions.newFee.amount} onChange={(e) => actions.setNewFee({ ...actions.newFee, amount: e.target.value })} className="w-32 p-2 border border-blue-300 rounded-md text-right" />
        <button onClick={actions.onAddFee} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm">
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    )}

    <div className="flex justify-end pt-4 items-center">
      <span className="text-gray-500 font-medium mr-4 text-sm">TOTAL ASSESSED FEES:</span>
      <span className="text-xl font-bold text-blue-600 border-b-2 border-blue-600 px-2">
        ₱ {Number(data?.totalAmountDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
    </div>
  </FormSection>
);

const FormSection = ({ title, children }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <h5 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2">{title}</h5>
    <div className="space-y-3">{children}</div>
  </div>
);

const ReadOnlyField = ({ label, value }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500">{label}</label>
    <p className="text-sm text-gray-800 p-2 bg-gray-100 rounded-md min-h-[38px]">{value || <span className="text-gray-400">N/A</span>}</p>
  </div>
);

const EditableField = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500">{label}</label>
    <input type="text" value={value || ''} onChange={onChange} disabled={disabled} className="w-full text-sm p-2 bg-white border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500" />
  </div>
);

