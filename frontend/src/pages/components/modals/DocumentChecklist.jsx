import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  ExclamationTriangleIcon, 
  CheckBadgeIcon 
} from '@heroicons/react/24/outline';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import AdminChecklist from './AdminChecklist';

export default function DocumentChecklist({ app, role, onUpdate }) {
  // If this is an Occupancy application and it references a Building application,
  // fetch that building application's documents and payment proof for view-only display.
  const [buildingDocs, setBuildingDocs] = useState([]);
  const [buildingAppId, setBuildingAppId] = useState('');
  const [buildingPayment, setBuildingPayment] = useState(null);
  const [buildingPermitNo, setBuildingPermitNo] = useState('');
  const [loadingBuildingRefs, setLoadingBuildingRefs] = useState(false);

  const axiosPrivate = useAxiosPrivate();
  const uploadedDocs = app.documents || [];

  // Use stable originalIndex from backend when available (prevents documents "disappearing" due to index drift)
  const docsWithIndices = uploadedDocs.map((doc, fallbackIndex) => ({
    doc,
    originalIndex: Number.isInteger(doc?.originalIndex) ? doc.originalIndex : fallbackIndex
  }));

  const groupLabel = (doc) => {
    if (doc?.uploadedBy === 'user') return 'Uploaded by Applicant';
    if (doc?.uploadedBy === 'system') return 'Uploaded by System';
    if (doc?.uploadedBy === 'admin') {
      if (doc?.uploadedByRole === 'MEO') return 'Uploaded by MEO Admin';
      if (doc?.uploadedByRole === 'BFP') return 'Uploaded by BFP Admin';
      if (doc?.uploadedByRole === 'MAYOR') return 'Uploaded by Mayor Admin';
      return 'Uploaded by Admin';
    }
    return 'Other Documents';
  };

  const groupedDocs = docsWithIndices.reduce((acc, item) => {
    const label = groupLabel(item.doc);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  const orderedGroups = [
    'Uploaded by Applicant',
    'Uploaded by System',
    'Uploaded by MEO Admin',
    'Uploaded by BFP Admin',
    'Uploaded by Mayor Admin'
  ];

  // Keep the "revisions" callout section working (applicant re-uploads)
  const revisions = docsWithIndices.filter(
    (d) => d?.doc?.uploadedBy === 'user' && d?.doc?.requirementName === 'Revised Checklist/Documents'
  );

  // Derived building reference used by Occupancy to link back to Building application
  const buildingRef = app.buildingPermitIdentifier || app.buildingPermitReferenceNo || app.permitInfo?.buildingPermitNo || '';
  const isOccupancy = (app.applicationType === 'Occupancy');

  useEffect(() => {
    let cancelled = false;
    const fetchBuildingData = async () => {
      if (!isOccupancy || !buildingRef) return;
      try {
        setLoadingBuildingRefs(true);
        const res = await axiosPrivate.get(`/api/applications/track/${buildingRef}`);
        const bApp = res.data?.application;
        if (!cancelled && bApp) {
          setBuildingDocs(bApp.documents || []);
          setBuildingPayment(bApp.paymentDetails || null);
          setBuildingPermitNo(bApp.permit?.permitNumber || bApp.referenceNo || buildingRef);
          // Store building app id for file viewing
          setBuildingAppId(
            typeof bApp._id === 'string' ? bApp._id : (bApp._id?.$oid || bApp._id?.toString?.() || '')
          );
        }
      } catch (e) {
        console.warn('Unable to load linked Building application for occupancy:', e?.response?.data || e.message);
      } finally {
        if (!cancelled) setLoadingBuildingRefs(false);
      }
    };
    fetchBuildingData();
    return () => { cancelled = true; };
  }, [isOccupancy, buildingRef]);
  const missingDocs = app.rejectionDetails?.missingDocuments || [];
  const paymentProof = app.paymentDetails?.proofOfPaymentFile;

  const handleViewPaymentProof = async () => {
    try {
      // Properly convert _id to string
      let appIdString;
      if (app._id) {
        if (typeof app._id === 'string') {
          appIdString = app._id;
        } else if (app._id.$oid) {
          appIdString = app._id.$oid;
        } else if (typeof app._id.toString === 'function') {
          appIdString = app._id.toString();
        } else {
          throw new Error('Invalid application ID format');
        }
      } else {
        throw new Error('Application ID is missing');
      }
      
      const response = await axiosPrivate.get(`/api/applications/${appIdString}/payment-proof`, {
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
   
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error viewing payment proof:', error);
      alert('Failed to load payment proof. Please try again.');
    }
  };

  const handleViewDocument = async (documentIndex) => {
    // Properly convert _id to string - handle various formats
    let appIdString;
    if (app._id) {
      if (typeof app._id === 'string') {
        appIdString = app._id;
      } else if (app._id.$oid) {
        // MongoDB ObjectId with $oid property
        appIdString = app._id.$oid;
      } else if (typeof app._id.toString === 'function') {
        // Object with toString method
        appIdString = app._id.toString();
      } else {
        // Last resort
        console.error('Unable to convert app._id to string. Type:', typeof app._id);
        alert('Invalid application ID format. Please refresh the page.');
        return;
      }
    } else {
      console.error('app._id is undefined');
      alert('Application ID is missing. Please refresh the page.');
      return;
    }
    
    try {
      console.log('=== DEBUG: handleViewDocument called ===');
      console.log('Document Index:', documentIndex);
      console.log('App._id:', app._id);
      console.log('App ID String:', appIdString);
      console.log('App ID String length:', appIdString?.length);
      console.log('Total documents:', uploadedDocs.length);
      console.log('Document at index:', uploadedDocs[documentIndex]);
      
      // Validate app._id exists and is complete
      if (!appIdString || appIdString.length < 24) {
        console.error('Invalid application ID:', app._id);
        console.error('Converted ID string:', appIdString);
        alert(`Invalid application ID: ${appIdString}. Please refresh the page and try again.`);
        return;
      }

      // Validate document index (originalIndex in DB). We can't reliably compare against array length
      // because originalIndex is stable even if indices are non-contiguous.
      if (Number.isNaN(Number(documentIndex)) || Number(documentIndex) < 0) {
        console.error('Invalid document index:', documentIndex);
        alert(`Invalid document index: ${documentIndex}. Please try again.`);
        return;
      }

      const url = `/api/applications/${appIdString}/documents/${documentIndex}/file`;
      console.log('Requesting URL:', url);
      
      const response = await axiosPrivate.get(url, {
        responseType: 'blob'
      });
      
      console.log('Response received, status:', response.status);
      
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Error viewing document:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('App ID:', appIdString, 'Document Index:', documentIndex);
      
      // Handle blob error responses properly
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          console.error('Error response text:', errorText);
          try {
            const errorJson = JSON.parse(errorText);
            alert(`Failed to load document: ${errorJson.message || 'Unknown error'}`);
          } catch (jsonError) {
            alert(`Failed to load document: ${errorText}`);
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          alert('Failed to load document. Please try again.');
        }
      } else if (error.response?.data) {
        alert(`Failed to load document: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      } else {
        alert(`Failed to load document: ${error.message || 'Unknown error'}`);
      }
    }
  };


  // (moved) document grouping is computed near the top using stable originalIndex

  return (
    <div>
      <h4 className="text-lg font-semibold border-b pb-2 mb-3 text-gray-800">Document Checklist</h4>

      {/* Building Permit Documents (View-Only, referenced) */}
      {isOccupancy && buildingRef && (
        <div className="space-y-3 mb-8">
          <h5 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">Documents from Building Permit Application</h5>
          {loadingBuildingRefs ? (
            <p className="text-sm text-gray-400 p-3 italic border border-dashed border-gray-200 rounded-lg text-center">Loading building permit documents...</p>
          ) : (
            <>
              {buildingPayment?.proofOfPaymentFile && (
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-green-500 mr-3"/>
                    <span className="font-medium text-sm text-gray-700">Proof of Payment (Building Permit)</span>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!buildingAppId) return alert('Linked Building Application not found');
                      try {
                        const response = await axiosPrivate.get(`/api/applications/${buildingAppId}/payment-proof`, { responseType: 'blob' });
                        const contentType = response.headers['content-type'] || 'application/octet-stream';
                        const blob = new Blob([response.data], { type: contentType });
                        const url = window.URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                      } catch (e) {
                        alert('Failed to load payment proof.');
                      }
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md border-none cursor-pointer"
                  >
                    View
                  </button>
                </div>
              )}
              {buildingDocs.length === 0 && (
                <p className="text-sm text-gray-400 p-3 italic border border-dashed border-gray-200 rounded-lg text-center">
                  No building permit documents found.
                </p>
              )}
              {buildingDocs.map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3"/>
                    <span className="font-medium text-sm text-gray-700">{doc.requirementName}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!buildingAppId) return alert('Linked Building Application not found');
                      try {
                        const response = await axiosPrivate.get(`/api/applications/${buildingAppId}/documents/${idx}/file`, { responseType: 'blob' });
                        const contentType = response.headers['content-type'] || 'application/octet-stream';
                        const blob = new Blob([response.data], { type: contentType });
                        const url = window.URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                      } catch (e) {
                        alert('Failed to load document.');
                      }
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md border-none cursor-pointer"
                  >
                    View
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-500 italic mt-2">These are read-only references to the original Building Permit files. Re-uploads are not allowed here.</p>
            </>
          )}
        </div>
      )}

      {/* GROUPED DOCUMENTS */}
      <div className="space-y-6 mb-8">
        {uploadedDocs.length === 0 ? (
          <p className="text-sm text-gray-400 p-3 italic border border-dashed border-gray-200 rounded-lg text-center">
            No documents uploaded yet.
          </p>
        ) : (
          orderedGroups
            .filter((g) => (groupedDocs[g] || []).length > 0)
            .map((groupName) => (
              <div key={groupName} className="space-y-2">
                <h5 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">{groupName}</h5>
                {(groupedDocs[groupName] || []).map((item) => (
                  <div
                    key={item.doc?._id || `${item.doc?.fileName || item.doc?.requirementName}-${item.originalIndex}`}
                    className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition"
                  >
                    <div className="flex items-center min-w-0">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-700 truncate">
                          {item.doc?.fileName || item.doc?.requirementName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded: {item.doc?.uploadedAt ? new Date(item.doc.uploadedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDocument(item.originalIndex)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md border-none cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ))
        )}
      </div>

      {/* FLAGGED ISSUES SECTION */}
      <div className="mt-6 pt-6 border-t-2 border-gray-100">
        <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <h5 className="text-md font-bold text-gray-800">Flagged Issues & Revisions</h5>
        </div>

        {/* REJECTION COMMENTS */}
        {app.rejectionDetails?.comments && app.status === 'Rejected' && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <p className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">Admin Comments:</p>
            <p className="text-sm text-gray-800 italic">"{app.rejectionDetails.comments}"</p>
          </div>
        )}

        {/* LIST OF MISSING ITEMS */}
        <div className="space-y-2 mb-4">
          {missingDocs.length === 0 ? (
            <p className="text-sm text-gray-400 italic ml-1">No active flags.</p>
          ) : (
            <>
              <p className="text-xs font-semibold text-red-800 mb-2 uppercase tracking-wide">Flagged Items ({missingDocs.length}):</p>
              <p className="text-xs text-gray-600 mb-3 italic">Use "Resolve Selected" in the Admin Checklist section below to resolve these items.</p>
              {missingDocs.map((docName, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg">
                  <span className="font-medium text-sm text-red-700 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      {docName}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* SHOW USER UPLOADED REVISIONS HERE */}
        {revisions.length > 0 && (
             <div className="mt-4 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse-once">
                <div className="flex items-center justify-between mb-2">
                    <h6 className="text-sm font-bold text-green-800 flex items-center">
                        <CheckBadgeIcon className="w-4 h-4 mr-1"/> 
                        Applicant Submitted Revisions
                    </h6>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">Latest</span>
                </div>
                <div className="space-y-2">
                    {revisions.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-green-100 shadow-sm">
                            <div>
                                <p className="text-sm font-semibold text-gray-800 flex items-center">
                                  <DocumentTextIcon className="w-4 h-4 text-green-600 mr-2"/>
                                  {item.doc.fileName || item.doc.requirementName}
                                </p>
                                <p className="text-xs text-gray-500 ml-6">Uploaded: {new Date(item.doc.uploadedAt).toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={() => handleViewDocument(item.originalIndex)} 
                                className="text-xs font-bold text-green-700 hover:underline flex items-center bg-transparent border-none cursor-pointer"
                            >
                                <ArrowDownTrayIcon className="w-3 h-3 mr-1"/> View File
                            </button>
                        </div>
                    ))}
                </div>
             </div>
        )}

        {/* ADMIN CHECKLIST - NEW SECTION */}
        <AdminChecklist app={app} role={role} onUpdate={onUpdate} />
      </div>

      {/* PROOF OF PAYMENT SECTION */}
      {paymentProof && (
        <div className="mt-8 pt-6 border-t-2 border-gray-100">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wide">Proof of Payment</h5>
            <div className="flex items-center justify-between bg-white p-3 rounded border border-blue-100">
               <span className="text-sm text-gray-600">Receipt / Screenshot</span>
               <button 
                 onClick={handleViewPaymentProof}
                 className="text-sm font-bold text-blue-600 hover:underline cursor-pointer bg-transparent border-none"
               >
                 View Image
               </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Submitted: {app.paymentDetails?.dateSubmitted ? new Date(app.paymentDetails.dateSubmitted).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}