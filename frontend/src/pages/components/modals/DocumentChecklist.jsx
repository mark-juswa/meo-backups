import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  ExclamationTriangleIcon, 
  CheckBadgeIcon 
} from '@heroicons/react/24/outline';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import AdminChecklist from './AdminChecklist';

export default function DocumentChecklist({ app, role, onUpdate }) {
  const axiosPrivate = useAxiosPrivate();
  const uploadedDocs = app.documents || [];
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

      // Validate document index
      if (documentIndex < 0 || documentIndex >= uploadedDocs.length) {
        console.error('Invalid document index:', documentIndex, 'Total docs:', uploadedDocs.length);
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


  // Create arrays with original indices preserved
  const docsWithIndices = uploadedDocs.map((doc, index) => ({ doc, originalIndex: index }));
  const revisions = docsWithIndices.filter(d => d.doc.requirementName === 'Revised Checklist/Documents');
  const standardDocs = docsWithIndices.filter(d => d.doc.requirementName !== 'Revised Checklist/Documents');

  return (
    <div>
      <h4 className="text-lg font-semibold border-b pb-2 mb-3 text-gray-800">Document Checklist</h4>

      {/* Original Submission */}
      <div className="space-y-3 mb-8">
        <h5 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">Original Requirements</h5>
        {standardDocs.length === 0 && (
          <p className="text-sm text-gray-400 p-3 italic border border-dashed border-gray-200 rounded-lg text-center">
            No original documents found.
          </p>
        )}
        {standardDocs.map((item, i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition">
            <div className="flex items-center">
                <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3"/>
                <span className="font-medium text-sm text-gray-700">{item.doc.requirementName}</span>
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