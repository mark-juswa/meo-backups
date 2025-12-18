import React from 'react';
import { getAppIdString } from '../../../utils/idConverter';
import { normalizeStatusForApp } from '../../../utils/statusNormalizer';

export default function WorkflowActions({ role, app, onUpdate, onOpenConfirm, onSaveAssessment }) {
  const status = app.status;
  const appId = getAppIdString(app);

  const isPaid = app.paymentDetails?.status === 'Verified' || app.workflowHistory?.some(h => h.status === 'Payment Submitted' || h.status === 'Pending BFP');

  // Detect if assessment has already been published to avoid duplicate publish actions
  const hasPublishedAssessment = (app.workflowHistory || []).some(h => {
    const c = (h.comments || '').toLowerCase();
    const s = (h.status || '').toLowerCase();
    const looksLikeAssessment = c.includes('assessment') || c.includes('fees');
    const looksLikePostAssessmentStatus = s === 'payment pending' || s === 'pending meo';
    return looksLikeAssessment && looksLikePostAssessmentStatus;
  });

  // Normalize UI status so Occupancy behaves like Building in the admin workflow
  const isOccupancy = app.applicationType === 'Occupancy' || !app.box1;
  const uiStatus = (isOccupancy && app.status === 'Pending MEO' && hasPublishedAssessment)
    ? 'Payment Pending'
    : app.status;

  const step2Label = hasPublishedAssessment
    ? 'Next Action: Await Client Payment / Continue Workflow'
    : 'Step 2: Assess Fees or flag documents';

  // Wrapper to ensure outgoing status is valid for specific app type
  const update = (statusArg, payload) => onUpdate(appId, normalizeStatusForApp(app, statusArg), payload);
  
  // Check history to see what has been done
  const hasBfpApproval = app.workflowHistory?.some(h => h.comments?.includes('BFP Inspection Passed'));
  const hasMayorApproval = app.workflowHistory?.some(h => h.comments?.includes('Mayor Permit Approved'));

  // CHECK FOR UNRESOLVED FLAGS
  const hasUnresolvedFlags = app.rejectionDetails?.missingDocuments?.length > 0 || 
                             (app.rejectionDetails?.isResolved === false);
  
  // Helper function to check if action should be blocked
  const isBlockedByFlags = () => {
    if (hasUnresolvedFlags) {
      alert('❌ Cannot proceed: There are unresolved flagged items.\n\nPlease resolve all flagged documents in the "Details & Checklist" tab before proceeding to the next step.');
      return true;
    }
    return false;
  };

  // --- SHARED HANDLER: REJECT ---
  const handleReject = () => {
    onOpenConfirm({
      title: 'Reject Application',
      message: 'Please enter the reason for rejection. This will be sent to the applicant.',
      showInput: true,
      confirmText: 'Confirm Rejection',
      onConfirm: (note) => {
        const prefix = role === 'bfpadmin' ? 'BFP Rejection: ' : (role === 'mayoradmin' ? 'Mayor Rejection: ' : 'MEO Rejection: ');
        update('Rejected', {
          comments: prefix + note,
          isResolved: false,
        });
      },
    });
  };

  // --- MEO ADMIN ---
  if (role === 'meoadmin') {
    switch (status) {
      case 'Submitted':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Step 1: Review documents.</p>
            <button onClick={() => update('Pending MEO', { comments: 'Accepted for review.' })} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Accept & Review</button>
            <button onClick={handleReject} className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">Reject Application</button>
          </div>
        );

      case 'Pending MEO':
        // Check if this is a assessment OR a return from BFP/Mayor
        if (isPaid) {
             return (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 font-medium">Application returned to MEO.</p>
                    
                    {/* Warning for unresolved flags */}
                    {hasUnresolvedFlags && (
                        <div className="bg-red-50 p-3 rounded border border-red-300">
                            <p className="text-xs font-bold text-red-800 mb-1">⚠️ Unresolved Flags Detected</p>
                            <p className="text-xs text-red-600">Please resolve all flagged items in "Details & Checklist" before proceeding.</p>
                        </div>
                    )}
                    
                    {/* If BFP approved but Mayor hasn't */}
                    {hasBfpApproval && !hasMayorApproval && (
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-xs text-blue-800 mb-2">BFP has issued FSEC. Forward to Mayor?</p>
                            <button 
                                onClick={() => {
                                    if (!isBlockedByFlags()) {
                                        update('Pending Mayor', { comments: 'MEO: Forwarding to Mayor for endorsement.' });
                                    }
                                }} 
                                disabled={hasUnresolvedFlags}
                                className={`w-full px-4 py-2 text-white rounded-lg font-medium ${hasUnresolvedFlags ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                Forward to Mayor
                            </button>
                        </div>
                    )}

                    {/* If Mayor has approved */}
                    {hasMayorApproval && (
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                            <p className="text-xs text-green-800 mb-2">Mayor has endorsed. Ready for Final Approval?</p>
                            <button 
                                onClick={() => {
                                    if (!isBlockedByFlags()) {
                                        update('Approved', { comments: 'MEO: Final Approval Granted. Ready for Permit Issuance.' });
                                    }
                                }} 
                                disabled={hasUnresolvedFlags}
                                className={`w-full px-4 py-2 text-white rounded-lg font-medium ${hasUnresolvedFlags ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                Final Approve
                            </button>
                        </div>
                    )}
                    
                    {/* If neither BFP nor Mayor have approved yet */}
                    {!hasBfpApproval && (
                         <button 
                            onClick={() => {
                                if (!isBlockedByFlags()) {
                                    update('Pending BFP', { comments: 'MEO: Forwarding to BFP.' });
                                }
                            }} 
                            disabled={hasUnresolvedFlags}
                            className={`w-full px-4 py-2 text-white rounded-lg font-medium ${hasUnresolvedFlags ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                        >
                            Forward to BFP
                        </button>
                    )}
                </div>
             );
        } 
        
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{step2Label}</p>
            {!hasPublishedAssessment && (
              <button onClick={onSaveAssessment} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save & Publish Assessment</button>
            )}
            {hasPublishedAssessment && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 p-2 rounded">Assessment already published.</p>
            )}
            <button onClick={handleReject} className="w-full px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-200">Reject</button>
          </div>
        );


      case 'Payment Pending':
         return <p className="text-sm text-gray-500">Waiting for payment...</p>;

      case 'Payment Submitted':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Verify Proof of Payment.</p>
            {hasUnresolvedFlags && (
                <div className="bg-red-50 p-3 rounded border border-red-300">
                    <p className="text-xs font-bold text-red-800 mb-1">⚠️ Unresolved Flags Detected</p>
                    <p className="text-xs text-red-600">Please resolve all flagged items before accepting payment.</p>
                </div>
            )}
            <div className="flex gap-2">
                <button 
                    onClick={() => {
                        if (!isBlockedByFlags()) {
                            update('Pending BFP', { comments: 'Payment Verified. Forwarding to BFP.' });
                        }
                    }} 
                    disabled={hasUnresolvedFlags}
                    className={`flex-1 px-3 py-2 text-white rounded-lg ${hasUnresolvedFlags ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    Accept
                </button>
                <button onClick={() => update('Payment Pending', { comments: 'Invalid Receipt.' })} className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Reject</button>
            </div>
          </div>
        );


      case 'Approved': 
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Final Approval Granted. Issue Permit.</p>
            {hasUnresolvedFlags && (
                <div className="bg-red-50 p-3 rounded border border-red-300">
                    <p className="text-xs font-bold text-red-800 mb-1">⚠️ Unresolved Flags Detected</p>
                    <p className="text-xs text-red-600">Please resolve all flagged items before issuing permit.</p>
                </div>
            )}
            <button 
                onClick={() => {
                    if (isBlockedByFlags()) return;
                    onOpenConfirm({
                        title: 'Issue Final Permit',
                        message: 'This will generate the permit number and notify the user.',
                        onConfirm: () => update('Permit Issued', { comments: 'Official Permit Issued.' })
                    });
                }} 
                disabled={hasUnresolvedFlags}
                className={`w-full px-4 py-2 text-white rounded-lg font-medium ${hasUnresolvedFlags ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
                Issue Final Permit
            </button>
          </div>
        );
      default: return <p className="text-sm text-gray-500">Status: {status} (Waiting for other dept)</p>;
    }
  }

  // --- BFP ADMIN ---
  if (role === 'bfpadmin') {
    switch (status) {
      case 'Pending BFP':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-bold">Action Required:</p>
                <p className="text-xs text-blue-600 mt-1">Review Docs & Site Inspection.</p>
            </div>
            
            {/* Warning for unresolved flags */}
            {hasUnresolvedFlags && (
                <div className="bg-red-50 p-3 rounded border border-red-300">
                    <p className="text-xs font-bold text-red-800 mb-1">⚠️ Unresolved Flags Detected</p>
                    <p className="text-xs text-red-600">Please resolve all flagged items in "Details & Checklist" before approving.</p>
                </div>
            )}
            
            {/* if approve: Send back to MEO with 'Pending MEO' status */}
            <button
              onClick={() => {
                if (isBlockedByFlags()) return;
                onOpenConfirm({
                  title: 'Approve & Issue FSEC',
                  message: 'Confirm inspection passed? This will notify MEO that FSEC is issued.',
                  confirmText: 'Approve (Notify MEO)',
                  onConfirm: () => {
                    update('Pending Mayor', { 
                        comments: 'BFP Inspection Passed. FSEC Issuance Completed. Forwarded to Mayor.' 
                    });
                  }
                });
              }}
              disabled={hasUnresolvedFlags}
              className={`w-full px-4 py-2 text-white rounded-lg font-bold shadow-sm ${hasUnresolvedFlags ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              Approve FSEC
            </button>

            {/* REJECT */}
            <button onClick={handleReject} className="w-full px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">
              Reject / Flag
            </button>
          </div>
        );
      default:
        return <div className="text-center p-4 bg-gray-50 rounded-lg text-sm text-gray-500">No actions available.</div>;
    }
  }

  // --- MAYOR ADMIN ---
  if (role === 'mayoradmin') {
    switch (status) {
      case 'Pending Mayor':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Review endorsements.</p>
            
            {/* Warning for unresolved flags */}
            {hasUnresolvedFlags && (
                <div className="bg-red-50 p-3 rounded border border-red-300">
                    <p className="text-xs font-bold text-red-800 mb-1">⚠️ Unresolved Flags Detected</p>
                    <p className="text-xs text-red-600">Please resolve all flagged items in "Details & Checklist" before approving.</p>
                </div>
            )}
            
            {/* APPROVE: Sends back to MEO with 'Pending MEO' status */}
            <button 
                onClick={() => {
                    if (isBlockedByFlags()) return;
                    update('Pending MEO', { comments: "Mayor Permit Approved. Returned to MEO for finalization." });
                }} 
                disabled={hasUnresolvedFlags}
                className={`w-full px-4 py-2 text-white rounded-lg font-medium ${hasUnresolvedFlags ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Approve
            </button>
            
            <button onClick={handleReject} className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">
              Reject
            </button>
          </div>
        );
      default:
        return <p className="text-sm text-gray-500">No actions available.</p>;
    }
  }

  return <p className="text-sm text-gray-500">No actions available.</p>;
}
