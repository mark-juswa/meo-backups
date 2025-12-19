// ApplicantDetails.jsx
import React from 'react';

function formatBuildingLocation(box1) {
  const loc = box1?.location;
  if (!loc) return '';

  const parts = [];
  // Optional lot/block identifiers (nice-to-have, but don't show "undefined")
  if (loc.lotNo) parts.push(`Lot ${loc.lotNo}`);
  if (loc.blkNo) parts.push(`Blk ${loc.blkNo}`);

  // Primary address components
  if (loc.street) parts.push(loc.street);
  if (loc.barangay) parts.push(loc.barangay);
  if (loc.city) parts.push(loc.city);

  return parts.filter(Boolean).join(', ');
}

function resolveApplicantAddress(app) {
  // Building application address lives in box1.location (street/brgy/city)
  const buildingAddr = formatBuildingLocation(app?.box1);
  if (buildingAddr) return buildingAddr;

  // Occupancy application keeps ownerDetails.address as a free-form string
  const occAddr = app?.ownerDetails?.address;
  if (occAddr) return occAddr;

  return '';
}

export default function ApplicantDetails({ app }) {
  const ownerName = [app?.applicant?.first_name, app?.applicant?.last_name].filter(Boolean).join(' ');
  const address = resolveApplicantAddress(app);

  return (
    <div>
      <h4 className="text-lg font-semibold border-b pb-2 mb-3">Applicant Details</h4>
      <ul className="text-sm space-y-2">
        <li><strong>Owner:</strong> <span>{ownerName || 'N/A'}</span></li>
        <li><strong>Email:</strong> <span>{app?.applicant?.email || 'N/A'}</span></li>
        <li><strong>Phone:</strong> <span>{app?.applicant?.phone_number || 'N/A'}</span></li>
        <li><strong>Type:</strong> <span>{app?.applicationType || 'N/A'}</span></li>
        <li><strong>Address:</strong> <span>{address || 'Not specified'}</span></li>
        <li><strong>Submitted:</strong> <span>{app?.createdAt ? new Date(app.createdAt).toLocaleString() : 'N/A'}</span></li>
        {app?.permit?.permitNumber && (
          <li>
            <strong>Permit Number:</strong>
            <span className="ml-2 font-mono text-green-700 font-bold bg-green-50 px-2 py-1 rounded">
              {app.permit.permitNumber}
            </span>
          </li>
        )}
        {app?.permit?.issuedAt && (
          <li><strong>Permit Issued:</strong> <span>{new Date(app.permit.issuedAt).toLocaleString()}</span></li>
        )}
      </ul>
    </div>
  );
}
