// WorkflowSteps.jsx
import React from 'react';
import { CheckIcon, ExclamationTriangleIcon as ExclamationIcon } from '@heroicons/react/24/outline';

// define per-role steps (you can tweak wording)
const stepsConfig = {
  meoadmin: [
    'Submitted',
    'MEO Review',
    'Payment',
    'BFP Clearance',
    'Mayor Endorsement',
    'Approved',
    'Permit Issued',
  ],
  bfpadmin: [
    'Submitted',
    'For BFP Review',
    'Inspection',
    'FSEC Approval',
    'Forward to MEO',
  ],
  mayoradmin: ['Submitted', 'For Mayor Review', 'Mayor Approval', 'Forward to MEO'],
};

const workflowStepMap = {
  Submitted: 0,
  'Pending MEO': 1,
  'Payment Pending': 2,
  'Pending BFP': 3,
  'Pending Mayor': 4,
  Approved: 5,
  'Permit Issued': 6,
  Rejected: 1,
};

export default function WorkflowSteps({ role = 'meoadmin', currentStatus }) {
  const steps = stepsConfig[role] || stepsConfig.meoadmin;
  const activeIndex = workflowStepMap[currentStatus] ?? 0;
  const isRejected = currentStatus === 'Rejected';

  return (
    <div className="space-y-4">
      {steps.map((stepName, index) => {
        let statusClass = 'step-pending bg-gray-300';
        let icon = index + 1;

        if (index < activeIndex) {
          statusClass = 'step-completed bg-green-400';
          icon = <CheckIcon className="w-4 h-4" />;
        } else if (index === activeIndex) {
          if (isRejected) {
            statusClass = 'bg-red-500';
            icon = <ExclamationIcon className="w-4 h-4" />;
          } else if (currentStatus === 'Permit Issued') {
            statusClass = 'step-completed bg-green-400';
            icon = <CheckIcon className="w-4 h-4" />;
          } else {
            statusClass = 'step-current bg-blue-500';
          }
        }

        return (
          <div key={index} className="flex items-start">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${statusClass} flex-shrink-0`}>
              {icon}
            </div>
            <div className="ml-3">
              <p className="font-semibold text-gray-700">{stepName}</p>
              {index === activeIndex && isRejected && <p className="text-xs text-red-500 font-medium">ACTION REQUIRED</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
