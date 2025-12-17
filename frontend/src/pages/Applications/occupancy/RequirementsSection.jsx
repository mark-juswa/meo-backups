import React from 'react';

const REQUIREMENTS = [
  {value: 'req_permit', label: 'Issued Building Permit and Plans (1 set)', helper: 'Bring the complete set including stamps and annotations.'},
  {value: 'req_logbook', label: 'Construction Logbook, signed and sealed', helper: 'Logbook must be up-to-date and sealed by engineer.'},
  {value: 'req_photos', label: 'Photos of Site/Project showing completion', helper: 'Show multiple angles including exterior and interior.'},
  {value: 'req_completion', label: '4 Sets Certificate of Completion', helper: 'Signed by the engineer/architect of record.'},
  {value: 'req_asbuilt', label: 'As-Built Plans and Specifications', helper: 'Reflects final construction condition.'},
  {value: 'req_fsec', label: 'Issued Fire Safety Evaluation Clearance (FSEC)', helper: 'Obtained from Fire Department.'}
];

const RequirementsSection = ({ formData, handleRequirementsChange, handleOtherDocsChange }) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">3. Requirements Submitted</h2>
      <p className="text-sm text-gray-500">This is a quick checklist for your reference. File uploads happen on the next page after submitting the application.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REQUIREMENTS.map(item => (
          <label key={item.value} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input type="checkbox" value={item.value} checked={formData.requirementsSubmitted.includes(item.value)} onChange={handleRequirementsChange} className="mt-1" />
            <span>
              <span className="block font-medium">{item.label}</span>
              <span className="block text-xs text-gray-500">{item.helper}</span>
            </span>
          </label>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Other documents (specify)</label>
        <input type="text" name="otherDocs" value={formData.otherDocs} onChange={handleOtherDocsChange} className="mt-1 p-2 border border-gray-300 rounded w-full" placeholder="e.g., Additional certifications or permits" />
      </div>
    </section>
  );
};

export default RequirementsSection;
