import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  CheckBadgeIcon, 
  ArrowDownTrayIcon, 
  PaperClipIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'; 
import { getStepsData, mapDbStatusToStep, StepItem, SubmittedDetailsModal } from './ApplicationTracker.jsx';
import { useLanguage } from '../../../context/LanguageContext.jsx'; 
import translations from '../../../lang/translations.js';

const PermitDashboard = ({ application }) => {
  const { language } = useLanguage();
  const t = translations[language].tracking.actions;

  const handleViewFile = (applicationId, documentIndex) => {
     if(!applicationId || documentIndex === undefined) return alert("File not found");
     const url = `/api/applications/${applicationId}/documents/${documentIndex}/file`;
     window.open(url, '_blank');
  };

  const handleViewPaymentProof = (applicationId) => {
     if(!applicationId) return alert("Payment proof not found");
     const url = `/api/applications/${applicationId}/payment-proof`;
     window.open(url, '_blank');
  };

  return (
    <div className="mt-10 border-t-2 border-gray-200 pt-10 animate-fade-in-up">
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center shadow-sm">
        <div className="flex justify-center mb-2">
            <div className="p-3 bg-green-100 rounded-full">
                <CheckBadgeIcon className="w-10 h-10 text-green-600" />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-green-800">{t.permitReadyTitle}</h2>
        <p className="text-green-700 mt-1">{t.permitReadyDesc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Claiming Instructions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-blue-900 px-6 py-4 border-b border-blue-800">
            <h3 className="text-white font-bold text-lg flex items-center">
              <BuildingLibraryIcon className="w-5 h-5 mr-2" /> {t.claimingInstr}
            </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
                <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mt-1">1</div>
                    <div className="ml-4">
                        <h4 className="text-md font-bold text-gray-800">{t.step1Title}</h4>
                        <p className="text-sm text-gray-600">{t.step1Desc}</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mt-1">2</div>
                    <div className="ml-4">
                        <h4 className="text-md font-bold text-gray-800">{t.step2Title}</h4>
                        <p className="text-sm text-gray-600">{t.step2Desc}</p>
                    </div>
                </div>
            </div>
            <div className="mt-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{t.refCardTitle}</p>
                <div className="text-3xl font-mono font-black text-gray-800 tracking-widest">{application.referenceNo}</div>
            </div>
            
            {/* Display Permit Number if Issued */}
            {application.permit?.permitNumber && (
              <div className="mt-4 bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center">
                <p className="text-xs text-green-700 uppercase tracking-wide font-semibold mb-1">BLDG. PERMIT NO.</p>
                <div className="text-3xl font-mono font-black text-green-800 tracking-widest">{application.permit.permitNumber}</div>
                <p className="text-xs text-gray-600 mt-2">Issued: {new Date(application.permit.issuedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* User Submitted Requirements */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
            <h3 className="text-white font-bold text-lg flex items-center">
              <PaperClipIcon className="w-5 h-5 mr-2" /> {t.submittedDocs}
            </h3>
          </div>
          
          <div className="p-0 overflow-y-auto max-h-[400px]">
            <ul className="divide-y divide-gray-100">
              {application.paymentDetails?.proofOfPaymentFile && (
                 <li className="flex items-center justify-between p-4 hover:bg-blue-50 transition duration-150 group">
                    <div className="flex items-center overflow-hidden">
                      <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition">
                          <CreditCardIcon className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                          <p className="text-sm font-bold text-gray-800">{t.proofPayment}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{application.paymentDetails.method || "Online"}</p>
                      </div>
                    </div>
                    <button 
                        onClick={() => handleViewPaymentProof(application._id)} 
                        className="text-xs font-medium flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
                    >
                      <QrCodeIcon className="w-3 h-3 mr-1.5" /> {t.view}
                    </button>
                 </li>
              )}
              {application.documents && application.documents.length > 0 ? (
                application.documents.map((doc, index) => (
                  <li key={index} className="flex items-center justify-between p-4 hover:bg-blue-50 transition duration-150 group">
                    <div className="flex items-center overflow-hidden">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition">
                          <DocumentTextIcon className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate pr-4" title={doc.requirementName}>{doc.requirementName}</p>
                          <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                        onClick={() => handleViewFile(application._id, index)} 
                        className="text-xs font-medium flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
                    >
                      <ArrowDownTrayIcon className="w-3 h-3 mr-1.5" /> {t.view}
                    </button>
                  </li>
                ))
              ) : (
                !application.paymentDetails?.proofOfPaymentFile && (
                    <li className="p-8 text-center text-gray-500 italic">{t.noDocs}</li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const TrackApplication = () => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  // Language Hooks
  const { language } = useLanguage();
  const t = translations[language].tracking;
  const tSteps = translations[language].tracking.steps; 

  const handleSearch = async (e) => {
    if (e) e.preventDefault(); 
    if (!trackingInput.trim()) {
      setError(t.errorInvalid);
      return;
    }
    setLoading(true);
    setApplication(null); 
    setError('');
    try {
      const res = await axios.get(`/api/applications/track/${trackingInput.trim()}`);
      setApplication(res.data.application);
      navigate(`/track/${trackingInput.trim()}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchFromUrl = async (searchId) => {
      setLoading(true);
      setApplication(null);
      setError('');
      try {
        const res = await axios.get(`/api/applications/track/${searchId}`);
        setApplication(res.data.application);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      setTrackingInput(id);
      searchFromUrl(id);
    }
  }, [id]);

  const currentStepNum = mapDbStatusToStep(application?.status);
  const isPermitIssued = application?.status === 'Permit Issued' || application?.status === 'Approved';


  const steps = getStepsData(translations[language].tracking);

  return (
    <div className="antialiased text-gray-800 bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className={`${isPermitIssued ? 'max-w-5xl' : 'max-w-xl'} mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200 transition-all duration-500`}>
          
          <h1 id="main-title" className="text-3xl font-bold mb-2 text-center text-gray-800">
            {application 
              ? `${t.title} - ${application.applicationType} Permit`
              : t.title
            }
          </h1>
          <p className="text-gray-500 text-center mb-6">{t.subtitle}</p>

          <form onSubmit={handleSearch} className="mb-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
            <input 
              type="text" 
              placeholder={t.placeholder}
              className="flex-1 w-full sm:w-auto max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? t.searching : t.search}
            </button>
          </form>
          
          {error && (
            <div id="error-message" className="text-center text-red-500 mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div id="status-timeline" className="step-container relative">
            {loading && (
              <p className="text-center text-gray-500 animate-pulse">{t.loadingDetails}</p>
            )}
            {!application && !loading && !error && (
               <div className="text-center py-10">
                 <p className="text-gray-400">{t.enterTracking}</p>
               </div>
            )}
            
            {application && (
              <div className="relative">
                <div 
                  className="timeline-line absolute left-6 top-0 bottom-0 w-0.5 bg-repeat-y"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #a1a1aa 1px, transparent 1px)',
                    backgroundSize: '2px 8px',
                    zIndex: 0
                  }}
                ></div>
                
                {steps.map((step) => (
                  <StepItem 
                    key={step.number}
                    step={step}
                    currentStepNum={currentStepNum}
                    dbStatus={application.status}
                    application={application} 
                    onOpenDetails={() => setShowDetailsModal(true)}
                  />
                ))}
              </div>
            )}
          </div>

          {isPermitIssued && application && (
            <PermitDashboard application={application} />
          )}

        </div>
      </div>
      {showDetailsModal && (
        <SubmittedDetailsModal 
            application={application} 
            onClose={() => setShowDetailsModal(false)} 
        />
      )}
    </div>
  );
};

export default TrackApplication;