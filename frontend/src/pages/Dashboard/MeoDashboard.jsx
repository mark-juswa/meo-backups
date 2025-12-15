import React, { useState, useEffect, useMemo } from "react";

import DashboardSidebar from "../components/layout/DashboardSidebar.jsx";
import DashboardHeader from "../components/layout/DashboardHeader.jsx";
import ApplicationTable from "../components/application/ApplicationTable.jsx";
import WorkflowModal from "../components/modals/WorkflowModal.jsx";
import CalendarPage from "../components/CalendarPage.jsx";

import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import UserListPage from '../components/layout/UserListPage.jsx';
import Me from '../Me.jsx';

import { ClockIcon, } from "@heroicons/react/24/solid"; 

export default function MeoDashboard() {
  const role = "meoadmin";
  const axiosPrivate = useAxiosPrivate();

  const [currentPage, setCurrentPage] = useState("overview");
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [selectedApp, setSelectedApp] = useState(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [users, setUsers] = useState([]);

  const FINISHED_STATUSES = ["Approved", "Permit Issued", "Rejected"];



  const fetchData = async () => {
    try {
      const [appsRes, eventsRes, usersRes] = await Promise.all([
        axiosPrivate.get("/api/applications/all"),
        axiosPrivate.get("/api/events"),
        axiosPrivate.get("/api/users")
      ]);


      setApplications(appsRes.data?.applications || []);
      setEvents(eventsRes.data?.events || []);
      setUsers(usersRes.data?.users || []);  
      setError(null);
    } catch (err) {
      console.error("Unable to load data:", err);
      setError("Unable to load data");
 
      setApplications([]);
      setEvents([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [axiosPrivate]);




  // STATS FOR OVERVIEW CARDS
  const stats = useMemo(() => {
    if (!Array.isArray(applications)) return { submitted: 0, pending: 0, approved: 0, total: 0 };

    const submitted = applications.filter((app) => app.status === "Submitted").length;
    const pending = applications.filter((app) =>
      ["Pending MEO", "Pending BFP", "Pending Mayor", "Payment Pending"].includes(
        app.status
      )
    ).length;
    const approved = applications.filter((app) => app.status === "Permit Issued").length;
    const total = applications.length;

    return { submitted, pending, approved, total };
  }, [applications]);


  const archivedApplications = useMemo(() => {
    return applications.filter(app =>
      FINISHED_STATUSES.includes(app.status)
    );
  }, [applications]);

  // FILTERED ARCHIVED APPLICATIONS (separate from main filter)
  const filteredArchivedApplications = useMemo(() => {
    if (!Array.isArray(archivedApplications)) return [];
    
    let filtered = archivedApplications;

    // Apply search filter
    const query = searchQuery.toLowerCase();
    if (query) {
      filtered = filtered.filter((app) => {
        const owner = `${app.applicant?.first_name || ""} ${app.applicant?.last_name || ""}`.toLowerCase();
        const ref = app.referenceNo?.toLowerCase() || "";
        return owner.includes(query) || ref.includes(query);
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter((app) => app.applicationType === typeFilter);
    }

    return filtered;
  }, [archivedApplications, searchQuery, statusFilter, typeFilter]);


  
  // SEARCH AND FILTER LOGIC
  const filteredApplications = useMemo(() => {
    if (!Array.isArray(applications)) return [];
    
    let filtered = applications;

    // Apply search filter
    const query = searchQuery.toLowerCase();
    if (query) {
      filtered = filtered.filter((app) => {
        const owner = `${app.applicant?.first_name || ""} ${app.applicant?.last_name || ""}`.toLowerCase();
        const ref = app.referenceNo?.toLowerCase() || "";
        return owner.includes(query) || ref.includes(query);
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter((app) => app.applicationType === typeFilter);
    }

    return filtered;
  }, [applications, searchQuery, statusFilter, typeFilter]);


  // MODAL HANDLERS
  const handleOpenModal = (app) => {
    setSelectedApp(app);
    setIsWorkflowModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedApp(null);
    setIsWorkflowModalOpen(false);
  };

  const handleUpdateApplication = async (appId, status, payload = {}) => {
    try {
      const response = await axiosPrivate.put(`/api/applications/${appId}/status`, {
        status,
        ...payload,
      });

      const updatedApp = response.data.application;

      setApplications((prev) =>
        prev.map((a) => (a._id === updatedApp._id ? updatedApp : a))
      );

      if (selectedApp?._id === updatedApp._id) {
        setSelectedApp(updatedApp);
      }
    } catch (err) {
      console.error("Failed to update application:", err);
      
      // Show specific error message from backend
      const errorMessage = err.response?.data?.message || "Failed to update application";
      const errorDetails = err.response?.data?.details;
      const unresolvedFlags = err.response?.data?.unresolvedFlags;
      
      let fullMessage = errorMessage;
      if (errorDetails) {
        fullMessage += `\n\n${errorDetails}`;
      }
      if (unresolvedFlags && unresolvedFlags.length > 0) {
        fullMessage += `\n\nUnresolved items:\n- ${unresolvedFlags.join('\n- ')}`;
      }
      
      alert(fullMessage);
      setError(errorMessage);
    }
  };

  // RENDER PAGE BASED ON SELECTED TAB
  const renderPage = () => {
    if (currentPage === "calendar") {
      return (
        <CalendarPage
          role={role}
          onEventsUpdated={fetchData} 
        />
      );
    }

    if (currentPage === "applications") {
      return (
        <ApplicationTable
          role={role}
          applications={filteredApplications}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          loading={loading}
          error={error}
          onManageClick={handleOpenModal}
        />
      );
    }

    // ARCHIVE TAB
    const renderArchivePage = () => (
      <ApplicationTable
        role={role}
        applications={filteredArchivedApplications}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        loading={loading}
        error={error}
        onManageClick={handleOpenModal}
        disableManage={true}
      />
    );

    if (currentPage === "archive") {
      return renderArchivePage();
    }

    if (currentPage === "users") {
      return (
        <UserListPage 
          users={users} 
          loading={loading} 
          onUserUpdated={fetchData} 
        />
      );
    }

    if (currentPage === "profile") {
      return <Me />;
    }

    return <OverviewPage stats={stats} applications={applications} events={events} onOpenApplication={(app) => handleOpenModal(app)} />;
  };

  return (
    <div className="flex h-screen antialiased bg-gray-100 relative">
      <DashboardSidebar
        role={role}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <DashboardHeader title={currentPage} />
        {renderPage()}
      </div>

      {isWorkflowModalOpen && selectedApp && (
        <WorkflowModal
          role={role}
          app={selectedApp}
          onClose={handleCloseModal}
          onUpdate={handleUpdateApplication}
        />
      )}
    </div>
  );
}



// OVERVIEW PAGE

function OverviewPage({ stats = {}, applications = [], events = [], onOpenApplication  }) {
  const safeStats = {
    submitted: 0,
    pending: 0,
    approved: 0,
    total: 0,
    ...stats
  };

  const recentActivities = useMemo(() => {
    if (!Array.isArray(applications)) return [];

    return applications
      .flatMap((app) =>
        (app.workflowHistory || []).map((entry) => ({
          ...entry,
          appName: app.referenceNo,
          timestamp: new Date(entry.timestamp),
        }))
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [applications]);

    const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
      case 'Permit Issued':
        return { 
          img: "/icons/approved.png",
        };

      case 'Rejected':
        return { 
          img: "/icons/rejected.png",
        };

      case 'Submitted':
      case 'Pending MEO':
      case 'Payment Pending':
        return { 
          img: "/icons/info.png",
        };

      default:
        return { 
          img: "/icons/default.png",
        };
    }


    const handleClickActivity = (appId) => {
      const app = applications.find(a => a._id === appId);
      if (app) {
        setSelectedApp(app);
        setIsWorkflowModalOpen(true);
      }
    };


  };

  const [showAllMobile, setShowAllMobile] = useState(false);

  // On small screens show only 5 unless expanded
const visibleActivities = useMemo(() => {
  if (typeof window !== "undefined" && window.innerWidth < 640) {
    return showAllMobile ? recentActivities : recentActivities.slice(0, 3);
  }
  return recentActivities; 
}, [recentActivities, showAllMobile]);


  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="New Applications" value={safeStats.submitted} color="text-blue-600" />
        <StatCard title="Pending Workflow" value={safeStats.pending} color="text-yellow-600" />
        <StatCard title="Permits Issued" value={safeStats.approved} color="text-green-600" />
        <StatCard title="Total Applications" value={safeStats.total} color="text-gray-800" />
      </div>

      {/* Activity + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Log */}
          <div className="card p-6 lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between m-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Recent Updates</h2>
            </div>

            <div className="flow-root px-3 sm:px-6">
              <ul role="list" className="pl-4 sm:pl-10 sm:pr-10 mb-8">
                {visibleActivities.length > 0 ? (
                  visibleActivities.map((entry, idx) => {
                    const style = getStatusStyle(entry.status);
                    return (
                      <li key={idx} 
                          className="hover:bg-gray-50 transition-colors mb-0 sm:mb-4 cursor-pointer"
                          onClick={() => onOpenApplication(applications.find(a => a.referenceNo === entry.appName))}>
                        <div className="relative pb-8">

                          {idx !== visibleActivities.length - 1 ? (
                            <span className="absolute top-6 left-5 hidden sm:block -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}

                          <div className="relative flex flex-col sm:flex-row sm:items-start sm:space-x-4">

                            {/* Icon */}
                            <div className="flex items-center mb-3 sm:mb-0">
                              <span className="h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white bg-gray-100">
                                <img 
                                  src={style.img}
                                  alt="status"
                                  className="w-6 h-6 object-contain"
                                />
                              </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">

                                {/* Left Side Content */}
                                <div className="min-w-0">
                                  <p className="text-sm text-gray-900 wrap-break-word">
                                    Status updated to <span className="font-bold">{entry.status}</span>
                                  </p>

                                  <div className="mt-1 text-sm text-gray-500 flex flex-wrap items-center gap-2">
                                    <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs border border-gray-200">
                                      {entry.appName}
                                    </span>

                                    <span className="truncate max-w-full sm:max-w-xs">
                                      {entry.comments}
                                    </span>
                                  </div>
                                </div>

                                {/* Timestamp */}
                                <div className="text-xs text-gray-400 whitespace-nowrap text-right">
                                  <time dateTime={entry.timestamp.toISOString()}>
                                    {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </time>
                                  <div>{entry.timestamp.toLocaleDateString()}</div>
                                </div>

                              </div>
                            </div>

                          </div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="py-6 text-center text-gray-500 italic bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    No recent activity found.
                  </li>
                )}
              </ul>

              {/* Show More button for mobile */}
              {recentActivities.length > 5 && (
                <div className="sm:hidden text-center mt-4">
                  <button
                    onClick={() => setShowAllMobile(!showAllMobile)}
                    className="text-blue-600 font-medium text-sm bg-blue-50 px-4 py-2 rounded-lg border border-blue-200"
                  >
                    {showAllMobile ? "Show Less" : "Show More"}
                  </button>
                </div>
              )}

            </div>
          </div>



        {/* Upcoming Schedule */}
        <div className="card p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
            Upcoming Schedule
          </h2>
          
          {(!Array.isArray(events) || events.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No scheduled events.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {events.slice(0, 5).map((ev) => (
                <li key={ev._id} className="p-3 border-l-4 border-blue-500 bg-blue-50/50 rounded-r-lg hover:bg-blue-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-800 text-sm">{ev.title}</p>
                    <span className="text-xs font-semibold text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100">
                       {new Date(ev.start).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    </span>
                  </div>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                     <ClockIcon className="w-3 h-3 mr-1" />
                     {new Date(ev.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {ev.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ev.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  const arrow = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );

  const isPrimary = color.includes("blue"); 

  return (
    <div
      className={`relative p-6 rounded-2xl shadow-sm border pt-10 pb-10 ${
        isPrimary
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-700"
          : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      {/* Arrow top-right */}
      <div
        className={`absolute top-4 right-4 p-2 rounded-full border ${
          isPrimary ? "border-white/40" : "border-gray-300"
        }`}>
        {arrow}
      </div>

      {/* Title */}
      <p className={`text-sm font-medium ${isPrimary ? "text-blue-100" : "text-gray-600"}`}>
        {title}
      </p>

      {/* Value */}
      <p className={`mt-2 text-4xl xl:text-6xl font-bold ${isPrimary ? "text-white" : color}`}>
        {value}
      </p>

    </div>
  );
}
