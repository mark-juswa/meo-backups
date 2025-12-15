// StatusBadge.jsx
import React from 'react';

export default function StatusBadge({ status }) {
  let colorClass = '';
  switch (status) {
    case 'Submitted':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'Pending MEO':
    case 'Pending BFP':
    case 'Pending Mayor':
      colorClass = 'bg-indigo-100 text-indigo-800';
      break;
    case 'Payment Pending':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'Rejected':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'Approved':
    case 'Permit Issued':
      colorClass = 'bg-green-100 text-green-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
      {status}
    </span>
  );
}
