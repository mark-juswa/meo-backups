// ApplicantDetails.jsx
import React from 'react';

export default function ApplicantDetails({ app }) {
  return (
    <div>
      <h4 className="text-lg font-semibold border-b pb-2 mb-3">Applicant Details</h4>
      <ul className="text-sm space-y-2">
        <li><strong>Owner:</strong> <span>{app.applicant?.first_name} {app.applicant?.last_name}</span></li>
        <li><strong>Email:</strong> <span>{app.applicant?.email || 'N/A'}</span></li>
        <li><strong>Phone:</strong> <span>{app.applicant?.phone_number || 'N/A'}</span></li>
        <li><strong>Type:</strong> <span>{app.applicationType || 'N/A'}</span></li>
        <li><strong>Address:</strong> <span>{app.box1?.addressOfLot || app.ownerDetails?.address || 'Not specified'}</span></li>
        <li><strong>Submitted:</strong> <span>{new Date(app.createdAt).toLocaleString()}</span></li>
        {app.permit?.permitNumber && (
          <li>
            <strong>Permit Number:</strong> 
            <span className="ml-2 font-mono text-green-700 font-bold bg-green-50 px-2 py-1 rounded">
              {app.permit.permitNumber}
            </span>
          </li>
        )}
        {app.permit?.issuedAt && (
          <li><strong>Permit Issued:</strong> <span>{new Date(app.permit.issuedAt).toLocaleString()}</span></li>
        )}
      </ul>
    </div>
  );
}
