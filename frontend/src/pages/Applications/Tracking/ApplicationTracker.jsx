import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../context/LanguageContext.jsx';
import translations from '../../../lang/translations.js';

// Convert stepsData to a function that takes 't' (translations)
export const getStepsData = (t) => [
  {
    number: 1,
    statusText: t.steps[1].status,
    description: t.steps[1].description,
    action: {
      title: (status) => t.actions.statusSubmitted,
      buttonText: (status) => t.actions.viewDetails,
      isModalTrigger: true
    }
  },
  {
    number: 2,
    statusText: t.steps[2].status,
    description: t.steps[2].description,
    action: {
      title: (status) => `${t.actions.status}: ${status}`,
      buttonText: (status) => t.actions.viewDocuments,
      hideButton: true
    }
  },
  {
    number: 3,
    statusText: t.steps[3].status,
    description: t.steps[3].description,
    action: {
      title: (status) => {
        if (status === 'Payment Submitted') return t.actions.statusPaymentVerif;
        return `${t.actions.status}: ${status}`;
      },
      buttonText: (status) => {
        if (status === 'Payment Pending') return t.actions.payNow;
        if (status === 'Payment Submitted') return t.actions.viewReceipt;
        if (status === 'For Revision' || status === 'Rejected') return t.actions.uploadRevisions;
        return t.actions.completeTask;
      },
      getLink: (application) => {
        if (application.status === 'Payment Pending') {
          return `/application/payment/${application.referenceNo}`;
        }
        if (application.status === 'For Revision' || application.status === 'Rejected') {
          return `/application/reupload/${application.referenceNo}`;
        }
        return "#";
      },
      isReadOnly: (status) => status === 'Payment Submitted'
    }
  },
  {
    number: 4,
    statusText: t.steps[4].status,
    description: t.steps[4].description,
    action: {
      title: (status) => `${t.actions.status}: ${status}`,
      buttonText: (status) => t.actions.downloadPermit
    }
  }
];

export const mapDbStatusToStep = (dbStatus) => {
  if (!dbStatus) return 0;
  switch (dbStatus) {
    case 'Submitted': return 1;
    case 'Pending MEO':
    case 'Pending BFP':
    case 'Pending Mayor': return 2;
    case 'Rejected':
    case 'For Revision':
    case 'Payment Pending':
    case 'Payment Submitted': return 3;
    case 'Approved':
    case 'Permit Issued': return 4;
    default: return 0;
  }
};

export const StepItem = ({ step, currentStepNum, dbStatus, application, onOpenDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = step.number === currentStepNum;
  const isCompleted = step.number < currentStepNum;

  // Hooks for language
  const { language } = useLanguage();
  const t = translations[language].tracking;

  useEffect(() => {
    setIsExpanded(isActive);
  }, [isActive]);

  const toggleExpand = () => setIsExpanded(prev => !prev);

  let circleClass = 'bg-gray-400';
  if (isActive) circleClass = 'bg-blue-600';
  else if (isCompleted) circleClass = 'bg-green-500';

  let textClass = 'text-gray-500';
  if (isActive) textClass = 'text-blue-600';
  else if (isCompleted) textClass = 'text-green-500';

  let buttonText = "View";
  let titleText = "";
  let buttonLink = "#";
  let buttonClass = "bg-emerald-500 hover:bg-emerald-600";
  let description = step.description;
  let showButton = true;

  if (step.action && step.action.title) {
    titleText = typeof step.action.title === 'function' ? step.action.title(dbStatus) : step.action.title;
  }

  if (step.action && step.action.buttonText) {
    buttonText = typeof step.action.buttonText === 'function' ? step.action.buttonText(dbStatus) : step.action.buttonText;
  }

  if (step.action && step.action.getLink) {
    buttonLink = step.action.getLink(application);
  }

  if (isActive && (dbStatus === 'Rejected' || dbStatus === 'For Revision')) {
    buttonClass = "bg-red-500 hover:bg-red-600";
    description = t.actions.returnDesc;
  }

  if (isActive && dbStatus === 'Payment Submitted') {
    description = t.actions.paymentWaitDesc;
    buttonClass = "bg-gray-400 cursor-not-allowed";
  }

  if (isActive && (dbStatus === 'Permit Issued' || dbStatus === 'Approved')) {
    showButton = false; 
    if(dbStatus === 'Approved') description = t.actions.approvedDesc;
  }

  if (step.action && step.action.hideButton) {
    showButton = false;
  }

  return (
    <div className={`step-item relative z-10 mb-4 ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
      <div className="step-header flex items-center space-x-4 cursor-pointer" onClick={toggleExpand}>
        <div className={`step-circle w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-lg font-semibold shadow-md transition-all duration-300 ease ${circleClass}`}>
          {step.number}
        </div>
        <h3 className={`text-lg font-semibold ${textClass}`}>{step.statusText}</h3>
        <svg className={`chevron-icon w-6 h-6 ml-auto transition-transform duration-300 transform ${textClass} ${isExpanded ? 'rotate-180' : 'rotate-0'}`} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd" />
        </svg>
      </div>

      <div className={`step-body ml-16 pl-2 pr-4 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 pt-4' : 'max-h-0'}`}>
        <p className="text-sm text-gray-500">{description}</p>

        {isActive && (application.rejectionDetails?.comments || application.rejectionDetails?.missingDocuments?.length > 0) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-700">{t.actions.adminFeedback}</h4>
            {application.rejectionDetails.comments && (
              <p className="text-sm text-red-600 italic">"{application.rejectionDetails.comments}"</p>
            )}
            {application.rejectionDetails.missingDocuments?.length > 0 && (
              <>
                <h5 className="font-semibold text-red-700 mt-2">{t.actions.missingDocs}</h5>
                <ul className="list-disc list-inside pl-2 text-sm text-red-600">
                  {application.rejectionDetails.missingDocuments.map(doc => <li key={doc}>{doc}</li>)}
                </ul>
              </>
            )}
          </div>
        )}

        {isActive && (
          <div className="fade-in mt-4">
            <p className="text-base font-semibold text-gray-700 mt-2">{titleText}</p>
            {showButton && (
              step.action?.isModalTrigger ? (
                <button onClick={onOpenDetails} className="inline-block px-6 py-3 mt-4 text-white font-semibold rounded-full shadow-md transition-colors duration-300 bg-blue-600 hover:bg-blue-700">
                  {buttonText}
                </button>
              ) : (
                <Link to={buttonLink} className={`inline-block px-6 py-3 mt-4 text-white font-semibold rounded-full shadow-md transition-colors duration-300 ${buttonClass}`}>
                  {buttonText}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const SubmittedDetailsModal = ({ application, onClose }) => {
  if (!application) return null;
  const { language } = useLanguage();
  const t = translations[language].tracking.actions;

  const getVal = (obj, path, fallback = 'N/A') => path.split('.').reduce((acc, part) => acc && acc[part], obj) || fallback;
  const isBuilding = application.applicationType === 'Building';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{translations[language].tracking.title}</h3>
            <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm mt-1">
              <p className="text-blue-600 font-medium"><span className="text-gray-500">Ref No:</span> {application.referenceNo}</p>
              <p className="text-gray-600"><span className="text-gray-500">{t.type}:</span> {application.applicationType}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-8">
          {/* Owner Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-300 pb-2">1. {t.ownerInfo}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <p className="font-semibold text-blue-700 mb-2">{t.ownerInfo}</p>
                <div className="space-y-2">
                  <div><span className="block text-xs text-gray-500 uppercase">{t.fullName}</span><span className="font-medium text-gray-800">{isBuilding ? `${getVal(application, 'box1.owner.firstName')} ${getVal(application, 'box1.owner.lastName')}` : `${getVal(application, 'ownerDetails.givenName')} ${getVal(application, 'ownerDetails.lastName')}`}</span></div>
                  <div><span className="block text-xs text-gray-500 uppercase">{translations[language].home.table.dateSubmitted}</span><span className="font-medium text-gray-800">{new Date(application.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-blue-700 mb-2">{t.projectDetails}</p>
                <div className="space-y-2">
                   <div><span className="block text-xs text-gray-500 uppercase">{t.projectTitle}</span><span className="font-medium text-gray-800">{isBuilding ? getVal(application, 'box1.enterprise.projectTitle') : getVal(application, 'projectDetails.projectName')}</span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end items-center pt-4 border-t border-gray-100">
             <span className="text-gray-500 mr-3 text-sm">{t.currentStatus}:</span>
             <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase">{application.status}</span>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end sticky bottom-0">
          <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition">{t.close}</button>
        </div>
      </div>
    </div>
  );
};