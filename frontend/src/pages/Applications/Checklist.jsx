import React, { useState } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Checklist = () => {
  const [activeTab, setActiveTab] = useState('building'); 

  const checklists = {
    building: [
      { title: "Checklist of Documents (Main)", file: "/checklists/building_permit_checklist.pdf" },
      { title: "Application for Building Permit Form", file: "/checklists/building_permit_form.pdf" },
      { title: "Electrical Permit Form", file: "/checklists/electrical_permit_form.pdf" },
      { title: "Sanitary/Plumbing Permit Form", file: "/checklists/sanitary_permit_form.pdf" }
    ],
    ancillary: [
      { title: "Architectural Permit", file: "/checklists/architectural_permit.pdf" },
      { title: "Civil/Structural Permit", file: "/checklists/civil_structural_permit.pdf" },
      { title: "Plumbing Permit", file: "/checklists/plumbing_permit.pdf" },
      { title: "Sanitary Permit", file: "/checklists/sanitary_permit.pdf" },
      { title: "Mechanical Permit", file: "/checklists/mechanical_permit.pdf" },
      { title: "Electronics Permit", file: "/checklists/electronics_permit.pdf" }
    ],
    occupancy: [
      { title: "Application for Certificate of Occupancy", file: "/checklists/occupancy_application.pdf" },
      { title: "Certificate of Completion Form", file: "/checklists/certificate_of_completion.pdf" }
    ]
  };

  const renderList = (items) => {
    return (
      <div className="space-y-6 mt-8 animate-fade-in">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3 sm:mb-0">
                <div className="p-2 bg-red-50 rounded-lg mr-4">
                    <DocumentTextIcon className="w-6 h-6 text-red-600" />
                </div>
                <span className="font-semibold text-gray-800 text-md">{item.title}</span>
            </div>
            <a 
              href={item.file} 
              download 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition shadow-sm w-full sm:w-auto"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Download PDF
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="text-center pt-12 pb-6 px-8">
            <h1 className="text-3xl font-extrabold text-blue-900">Permit Application Forms & Checklists</h1>
            <p className="text-gray-500 mt-2">Select a category below to access all required PDF documents</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center px-6 mb-6">
            <div className="bg-gray-100 p-1 rounded-xl inline-flex">
                <button 
                    onClick={() => setActiveTab('building')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'building' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Building Permit Forms
                </button>
                <button 
                    onClick={() => setActiveTab('ancillary')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'ancillary' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Ancillary Permits
                </button>
                <button 
                    onClick={() => setActiveTab('occupancy')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'occupancy' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Certificate Of Occupancy
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="px-8 pb-12 min-h-[400px]">
            {activeTab === 'building' && (
                <div>
                    <h3 className="text-xl font-bold text-blue-800 border-b border-gray-200 pb-4">Building Permit Application Requirements</h3>
                    {renderList(checklists.building)}
                </div>
            )}

            {activeTab === 'ancillary' && (
                <div>
                    <h3 className="text-xl font-bold text-blue-800 border-b border-gray-200 pb-4">Ancillary Permits (Specialized Documents)</h3>
                    {renderList(checklists.ancillary)}
                </div>
            )}

            {activeTab === 'occupancy' && (
                <div>
                    <h3 className="text-xl font-bold text-blue-800 border-b border-gray-200 pb-4">Certificate of Occupancy & Accessory Permits</h3>
                    {renderList(checklists.occupancy)}
                </div>
            )}
        </div>

        {/* Footer Note */}
        <div className="bg-gray-100 p-4 text-center border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Note: Please Print The Documents In Legal Size Paper Back To Back</p>
        </div>

      </div>
    </div>
  );
};

export default Checklist;