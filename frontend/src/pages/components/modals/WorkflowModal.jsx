// WorkflowModal.jsx
import React, { useState } from 'react';
import WorkflowSteps from './WorkflowSteps';
import WorkflowActions from './WorkflowActions';
import ApplicantDetails from './ApplicantDetails';
import DocumentChecklist from './DocumentChecklist';
import ApplicationFormView from './ApplicationFormView';
import WorkflowHistory from './WorkflowHistory';
import ConfirmationModal from './ConfirmationModal';
import { normalizeStatusForApp } from '../../../utils/statusNormalizer';
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline';
import { getAppIdString } from '../../../utils/idConverter';

export default function WorkflowModal({ role, app, onClose, onUpdate }) {
  const appId = getAppIdString(app);
  const [activeTab, setActiveTab] = useState('details');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmProps, setConfirmProps] = useState({});

  const [assessmentData, setAssessmentData] = useState({
    box5: app.box5 || app.assessmentDetails || {},
    box6: app.box6 || app.feesDetails || { fees: [], totalAmountDue: 0 },
  });
  const [newFee, setNewFee] = useState({ particular: '', amount: 0 });

  const openConfirm = (props) => {
    setConfirmProps(props);
    setIsConfirmOpen(true);
  };
  const closeConfirm = () => setIsConfirmOpen(false);

  const handleAssessmentChange = (box, field, value) => {
    setAssessmentData((prev) => ({
      ...prev,
      [box]: { ...(prev[box] || {}), [field]: value },
    }));
  };

  const handleAddFee = () => {
    if (!newFee.particular || Number(newFee.amount) <= 0) return;
    const updated = [...(assessmentData.box6.fees || []), { ...newFee, amount: Number(newFee.amount) }];
    const total = updated.reduce((s, f) => s + Number(f.amount), 0);
    setAssessmentData((prev) => ({ ...prev, box6: { fees: updated, totalAmountDue: total } }));
    setNewFee({ particular: '', amount: 0 });
  };

  const handleRemoveFee = (index) => {
    const updated = (assessmentData.box6.fees || []).filter((_, i) => i !== index);
    const total = updated.reduce((s, f) => s + Number(f.amount), 0);
    setAssessmentData((prev) => ({ ...prev, box6: { fees: updated, totalAmountDue: total } }));
  };

  // Save assessment and move status (used by MEO)
  const saveAndPublishAssessment = () => {
    if (!app?._id) return;
    
    // Check if there are unresolved flags
    const hasUnresolvedFlags = app.rejectionDetails?.missingDocuments?.length > 0;
    
    if (hasUnresolvedFlags) {
      alert('Cannot publish assessment: There are unresolved flagged issues. Please resolve all flags in the "Details & Checklist" tab before publishing.');
      return;
    }
    
    // Clear rejection details and publish assessment
    onUpdate(appId, normalizeStatusForApp(app, 'Payment Pending'), {
      box5: assessmentData.box5,
      box6: assessmentData.box6,
      comments: 'Assessment fees calculated and published for payment.',
      // Clear rejection details
      rejectionDetails: {
        comments: '',
        missingDocuments: [],
        isResolved: true
      }
    });
  };

  return (
    <>
      <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl shadow-2xl">
          <div className="flex justify-between items-start mb-6 border-b pb-3">
            <h3 className="text-2xl font-bold text-gray-800">
              Application Workflow: <span className="text-blue-600">{app.referenceNo}</span>
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* left */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-4 border-l-4 border-blue-500 bg-white rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500">Current Status</p>
                <div className="mt-1">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {app.status}
                  </span>
                </div>
              </div>

              <div className="card p-6 space-y-3 bg-white rounded-lg shadow-sm">
                <h4 className="text-lg font-semibold border-b pb-2 mb-3">Process Steps</h4>
                <WorkflowSteps role={role} currentStatus={app.status} />
              </div>

              <div className="card p-6 bg-gray-50 space-y-3 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-700">Next Action</h4>
                <WorkflowActions
                  role={role}
                  app={app}
                  onUpdate={onUpdate}
                  onOpenConfirm={(props) => openConfirm(props)}
                  onSaveAssessment={saveAndPublishAssessment}
                />
              </div>
            </div>

            {/* right */}
            <div className="lg:col-span-2 space-y-6">
              <nav className="flex border-b border-gray-200">
                <TabButton label="Details & Checklist" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                <TabButton label="View/Assess Form" isActive={activeTab === 'form'} onClick={() => setActiveTab('form')} />
                <TabButton label="Workflow History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
              </nav>

              <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                <div className="card p-6 bg-white rounded-lg shadow-sm space-y-6">
                  <ApplicantDetails app={app} />
                  <DocumentChecklist app={app} role={role} onUpdate={onUpdate} />
                </div>
              </div>

              <div className={activeTab === 'form' ? 'block' : 'hidden'}>
                <div className="card p-6 bg-white rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold">Client Submitted Form</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Review submitted data. {role === 'meoadmin' ? 'MEO Admin must fill out Box 5 and Box 6 to calculate fees.' : 'Read-only view.'}
                  </p>
                  <div className="border border-gray-200 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                    <ApplicationFormView
                      app={app}
                      assessmentData={assessmentData}
                      onAssessmentChange={handleAssessmentChange}
                      onAddFee={handleAddFee}
                      onRemoveFee={handleRemoveFee}
                      newFee={newFee}
                      setNewFee={setNewFee}
                      canEditAssessment={role === 'meoadmin'}
                    />
                  </div>
                </div>
              </div>

              <div className={activeTab === 'history' ? 'block' : 'hidden'}>
                <WorkflowHistory history={app.workflowHistory || []} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isConfirmOpen && (
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={closeConfirm}
          {...confirmProps}
        />
      )}
    </>
  );
}

function TabButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`tab-btn py-3 px-4 text-sm font-semibold transition-all duration-200 ${
        isActive
          ? 'border-b-3 border-blue-500 text-blue-500'
          : 'border-b-3 border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}
