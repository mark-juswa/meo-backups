import React, { useState } from 'react';
import ApplicantSection from './ApplicantSection';
import ProjectLocationSection from './ProjectLocationSection';
import ScopeOfWorkSection from './ScopeOfWorkSection';
import OccupancySection from './OccupancySection';
import ProjectDetailsSection from './ProjectDetailsSection';

/**
 * Redesigned Step 1: Task-oriented, user-friendly sections
 * Replaces the old Box 1 form layout
 * Maintains 100% compatibility with existing state structure
 */
const Step1Redesigned = ({ box1, setBox1, errors, activeSection: controlledActiveSection, setActiveSection: setControlledActiveSection, showQuickNav = true }) => {
  // Track which sub-section is currently active (for progressive disclosure)
  const [uncontrolledActive, setUncontrolledActive] = useState('applicant');
  const activeSection = controlledActiveSection ?? uncontrolledActive;
  const setActiveSection = setControlledActiveSection ?? setUncontrolledActive;

  const sections = [
    { id: 'applicant', label: 'Who Are You?'},
    { id: 'location', label: 'Project Location'},
    { id: 'scope', label: 'Type of Work'},
    { id: 'occupancy', label: 'Building Use'},
    { id: 'details', label: 'Project Size & Timeline'}
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'applicant':
        return <ApplicantSection box1={box1} setBox1={setBox1} errors={errors} />;
      case 'location':
        return <ProjectLocationSection box1={box1} setBox1={setBox1} errors={errors} />;
      case 'scope':
        return <ScopeOfWorkSection box1={box1} setBox1={setBox1} errors={errors} />;
      case 'occupancy':
        return <OccupancySection box1={box1} setBox1={setBox1} errors={errors} />;
      case 'details':
        return <ProjectDetailsSection box1={box1} setBox1={setBox1} errors={errors} />;
      default:
        return null;
    }
  };

  return (
    <div className="step1-redesigned">
      {/* Section Navigation */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Complete These Sections:</h3>
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          You can navigate between sections freely. All information is saved as you type.
        </p>
      </div>

      {/* Active Section Content */}
      <div className="section-content bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        {renderSection()}
      </div>

      {showQuickNav && (
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => {
              const currentIndex = sections.findIndex(s => s.id === activeSection);
              if (currentIndex > 0) {
                setActiveSection(sections[currentIndex - 1].id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={activeSection === 'applicant'}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={() => {
              const currentIndex = sections.findIndex(s => s.id === activeSection);
              if (currentIndex < sections.length - 1) {
                setActiveSection(sections[currentIndex + 1].id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={activeSection === 'details'}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Step1Redesigned;
