// WorkflowHistory.jsx
import React from 'react';

export default function WorkflowHistory({ history = [] }) {
  return (
    <div className="card p-6 bg-white rounded-lg shadow-sm">
      <h4 className="text-lg font-semibold border-b pb-2 mb-3">Workflow History</h4>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {[...history].reverse().map((entry) => (
          <div
            key={entry._id || `${entry.status}-${entry.timestamp}`}
            className={`border-l-4 ${entry.status === 'Rejected' ? 'border-red-500' : entry.status === 'Approved' || entry.status === 'Permit Issued' ? 'border-green-500' : 'border-blue-300'} pl-3 pb-2`}
          >
            <p className="font-semibold text-sm text-gray-800">{entry.status}</p>
            <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
            {entry.comments && <p className="text-xs mt-1 p-2 bg-gray-100 rounded-lg">{entry.comments}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
