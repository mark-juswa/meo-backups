import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import translations from "../lang/translations.js";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getStepsData, mapDbStatusToStep, StepItem, SubmittedDetailsModal } from "./Applications/Tracking/ApplicationTracker.jsx";


//  MAIN HOME COMPONENT

const getStatusBadge = (status) => {
  switch (status) {
    case "Submitted":
    case "Pending MEO":
    case "Pending BFP":
    case "Pending Mayor":
      return "bg-yellow-100 text-yellow-800";
    case "Approved":
    case "Permit Issued":
      return "bg-green-100 text-green-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "For Revision":
      return "bg-blue-100 text-blue-800";
    case "Payment Pending":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getActionLink = (status, id, referenceNo, t) => {
  let text = t.viewDetails;
  let to = `/track/${referenceNo}`;

  switch (status) {
    case "Approved":
    case "Permit Issued":
      text = t.viewIssuedPermit;
      break;
    case "For Revision":
      text = t.uploadFiles;
      to = `/application/edit/${id}`;
      break;
    case "Payment Pending":
      text = t.viewDetails;
      break;
  }

  return (
    <Link to={to} className="text-blue-600 hover:text-blue-900">
      {text}
    </Link>
  );
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Home = () => {
  const { auth } = useAuth();

  // FOR TRANSLATIONS
  const { language } = useLanguage();
  const t = translations[language].home;
  const tTracker = translations[language].tracking;

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [trackLoading, setTrackLoading] = useState(true);

  // For the authoritative flow: BUILDING -> OCCUPANCY (final)
  const [hasOccupancyApplication, setHasOccupancyApplication] = useState(false);
  const [isOccupancyPermitIssued, setIsOccupancyPermitIssued] = useState(false);

  const [activeApplication, setActiveApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!auth?.accessToken) {
      setTrackLoading(false);
      setHasOccupancyApplication(false);
      setIsOccupancyPermitIssued(false);
      setActiveApplication(null);
      return;
    }

    const fetchData = async () => {
      setTrackLoading(true);
      try {
        const [profileRes, appsRes] = await Promise.all([
          axios.get("/api/users/me", {
            headers: { Authorization: `Bearer ${auth.accessToken}` },
            withCredentials: true,
          }),
          axios.get("/api/applications/my-applications", {
            headers: { Authorization: `Bearer ${auth.accessToken}` },
            withCredentials: true,
          }),
        ]);

        setProfile(profileRes.data);

        const sortedApps = appsRes.data.applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setApplications(sortedApps);

        if (sortedApps.length > 0) {
           // AUTHORITATIVE CLIENT JOURNEY:
           // - Track BUILDING until an OCCUPANCY application exists
           // - Once OCCUPANCY exists, track OCCUPANCY
           // - Hide tracker ONLY when OCCUPANCY reaches "Permit Issued"

           const latestOccupancy = sortedApps.find(
             (a) => String(a.applicationType).toLowerCase() === 'occupancy'
           );
           const latestBuilding = sortedApps.find(
             (a) => String(a.applicationType).toLowerCase() === 'building'
           );

           const occupancyExists = !!latestOccupancy;
           const occupancyPermitIssued = latestOccupancy?.status === 'Permit Issued';
           setHasOccupancyApplication(occupancyExists);
           setIsOccupancyPermitIssued(!!occupancyPermitIssued);

           const toTrack = latestOccupancy || latestBuilding || sortedApps[0];

           if (toTrack && !occupancyPermitIssued) {
             try {
               const detailRes = await axios.get(`/api/applications/track/${toTrack.referenceNo}`);
               setActiveApplication(detailRes.data.application);
             } catch (err) {
               console.error("Could not fetch full details for tracker", err);
               setActiveApplication(toTrack);
             }
           } else {
             // Occupancy is final step; once it reaches Permit Issued, tracker can be hidden/replaced
             setActiveApplication(null);
           }
        } else {
          setHasOccupancyApplication(false);
          setIsOccupancyPermitIssued(false);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data.");
      } finally {
        setTrackLoading(false);
      }
    };

    fetchData();
  }, [auth]);

  const scrollToApplication = () => {
    const section = document.getElementById("application");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const steps = getStepsData(
    tTracker,
    activeApplication?.status === 'Permit Issued' || activeApplication?.status === 'Approved'
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      
{/* ACTIVE APPLICATION TRACKER VIEW */}

      {activeApplication ? (
        <div className="mb-20 animate-fade-in">
           <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-blue-900 mb-2">
                   {tTracker.title}: {activeApplication.applicationType} Permit
                </h2>
                <p className="text-gray-500">
                  Reference No: <span className="font-mono font-bold text-gray-700">{activeApplication.referenceNo}</span>
                </p>
              </div>

              {/* PERMIT ISSUED CALLOUT */}
              {activeApplication.status === 'Permit Issued' && (
                <div className="mb-8 max-w-3xl mx-auto bg-green-50 border border-green-200 rounded-xl p-5">
                  <p className="text-green-900 font-semibold">
                    Your permit has been approved and issued. You may now download or claim it.
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Status:</span>{' '}
                      <span className="inline-flex px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                        Permit Issued
                      </span>
                    </div>

                    {/* Proceed button: only relevant after Building permit is issued */}
                    {String(activeApplication.applicationType).toLowerCase() === 'building' && (
                      <Link
                        to={`/occupancy-application/${activeApplication.referenceNo}`}
                        className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold px-6 py-2 text-sm hover:bg-blue-700 transition"
                      >
                        Proceed to Occupancy Application
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="relative">
                <div 
                  className="timeline-line absolute left-6 top-0 bottom-0 w-0.5 bg-repeat-y"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #a1a1aa 1px, transparent 1px)',
                    backgroundSize: '2px 8px',
                    zIndex: 0
                  }}>
                </div>

                {steps.map((step) => (
                  <StepItem 
                    key={step.number}
                    step={step}
                    currentStepNum={mapDbStatusToStep(activeApplication.status, activeApplication)}
                    dbStatus={activeApplication.status}
                    application={activeApplication} 
                    onOpenDetails={() => setShowDetailsModal(true)}
                  />
                ))}
              </div>
           </div>
        </div>

      ) : (
        <>
          {/* HERO/COMPLETION SECTION (shown when there is no active tracker application) */}
          {isOccupancyPermitIssued && (
            <div className="mb-16 max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-green-200">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-extrabold text-green-800 mb-2">
                  Process Complete
                </h2>
                <p className="text-gray-600">
                  Your Occupancy Permit has been issued. You can still review your application history below.
                </p>
              </div>
            </div>
          )}

          {/* HERO SECTION (Show if walang active na application) */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-16">
            <div className="flex justify-center md:justify-start">
              <img
                src="/illustration.jpg"
                alt="Homepage illustration"
                className="w-full max-w-lg object-contain"
              />
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-900 leading-tight">
                {t.title1}
                <br />
                <span className="text-blue-600">{t.title2}</span>
              </h2>

              <p className="text-gray-600 text-sm sm:text-base md:text-md max-w-lg">
                {t.welcome}
              </p>

              <div>
                <button
                  onClick={scrollToApplication}
                  className="cursor-pointer rounded-full bg-blue-400 text-white font-semibold px-8 py-3 text-sm sm:text-base transition hover:bg-blue-500"
                >
                  {t.start}
                </button>
              </div>
            </div>
          </div>

          {/* APPLICATION SECTION (Building and occupancy)
              Hide Apply buttons ONLY WHEN an Occupancy application already exists. */}
          {!hasOccupancyApplication && (
            <section id="application" className="text-center mt-40">
            <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-3">
              {t.applyNewPermit}
            </h2>

            <p className="text-gray-600 max-w-2xl mx-auto mb-12 text-sm md:text-base">
              {t.applyNewDesc}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* BUILDING PERMIT */}
              <div className="rounded-2xl shadow-md p-8 flex flex-col items-center justify-between hover:shadow-xl transition">
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <img src="/skyscraper.png" alt="Building Icon" className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-700">{t.applyFor}</h3>
                  <h2 className="text-2xl font-bold text-blue-900">{t.buildingPermit}</h2>
                  <p className="text-sm text-gray-500 text-center">{t.buildingDesc}</p>
                </div>

                <div className="mt-6 flex flex-col items-center space-y-3">
                  <Link to="/building-application" className="cursor-pointer rounded-full bg-blue-400 text-white font-semibold px-8 py-3 text-sm sm:text-base hover:bg-blue-500 transition">
                    {t.applyNow}
                  </Link>
                  <Link to="/checklist" className="text-blue-600 text-sm hover:underline">
                    {t.downloadChecklist}
                  </Link>
                </div>
              </div>

              {/* OCCUPANCY PERMIT */}
              <div className="rounded-2xl shadow-md p-8 flex flex-col items-center justify-between hover:shadow-xl transition">
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <img src="/apartments.png" alt="Occupancy Icon" className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-700">{t.applyFor}</h3>
                  <h2 className="text-2xl font-bold text-blue-900">{t.occupancyPermit}</h2>
                  <p className="text-sm text-gray-500 text-center">{t.occupancyDesc}</p>
                </div>

                <div className="mt-6 flex flex-col items-center space-y-3">
                  <Link to="/occupancy-application" className="cursor-pointer rounded-full bg-blue-400 text-white font-semibold px-8 py-3 text-sm sm:text-base hover:bg-blue-500 transition">
                    {t.applyNow}
                  </Link>
                  <Link to="/checklist" className="text-blue-600 text-sm hover:underline">
                    {t.downloadChecklist}
                  </Link>
                </div>
              </div>
            </div>
            </section>
          )}
        </>
      )}


      {/* TRACK APPLICATION SECTION (This will serve as history para sa client) */}
      <section id="track" className="mt-40 py-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-3">
            {t.trackTitle}
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto mb-12 text-sm md:text-base">
            {t.trackDesc}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg max-w-5xl mx-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-xl">{t.table.application}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.table.reference}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.table.dateSubmitted}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.table.status}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">{t.table.actions}</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {trackLoading && (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">{t.loading}</td></tr>
                )}

                {!trackLoading && !auth && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      {t.loginToView}{" "}
                      <Link to="/login" className="text-blue-600 hover:underline">{translations[language].navbar.login}</Link>
                    </td>
                  </tr>
                )}

                {!trackLoading && auth && applications.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">{t.noApplications}</td></tr>
                )}

                {!trackLoading && auth && applications.length > 0 && applications.map((app) => (
                  <tr key={app._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{app.applicationType} Permit</td>
                    <td className="px-6 py-4 whitespace-nowrap">{app.referenceNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(app.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-light rounded-full ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {getActionLink(app.status, app._id, app.referenceNo, t)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-center">
            <Link to="/track" className="rounded-full bg-blue-400 text-white font-semibold px-8 py-3 text-sm sm:text-base hover:bg-blue-500 transition">
              {t.showMore}
            </Link>
          </div>
        </div>
      </section>


      {showDetailsModal && activeApplication && (
        <SubmittedDetailsModal 
            application={activeApplication} 
            onClose={() => setShowDetailsModal(false)} 
        />
      )}

    </main>
  );
};

export default Home;