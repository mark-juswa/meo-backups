import React, { useState, useEffect, useMemo } from "react";
import DashboardSidebar from "../components/layout/DashboardSidebar.jsx";
import ApplicationTable from "../components/application/ApplicationTable.jsx";
import WorkflowModal from "../components/modals/WorkflowModal.jsx";
import CalendarPage from "../components/CalendarPage.jsx";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import Me from '../Me.jsx';

export default function BfpDashboard() {
  const role = "bfpadmin"; 
  const axiosPrivate = useAxiosPrivate();

  // --- State ---
  const [currentPage, setCurrentPage] = useState("overview");
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  useEffect(() => {
    setSearchQuery("");
    setStatusFilter("");
  }, [currentPage]);


  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, eventsRes] = await Promise.all([
        axiosPrivate.get("/api/applications/all"),
        axiosPrivate.get("/api/events")
      ]);

      const allApps = appsRes.data?.applications || [];

      // FILTER Only get applications relevant to BFP
      const bfpApps = allApps.filter(app => {
        const status = app.status;
        const isPending = status === "Pending BFP";
        const hasHistory = (app.workflowHistory || []).some(h => 
          h.role === "bfpadmin" || (h.comments || "").toLowerCase().includes("bfp")
        );
        
        return isPending || hasHistory;
      });

      setApplications(bfpApps);
      setEvents(eventsRes.data?.events || []);
      setError(null);

    } catch (err) {
      console.error("Error loading BFP data:", err);
      if (err.response?.status === 401) {
         setError("Session expired. Please logout and login again.");
      } else {
         setError("Unable to load data.");
      }
      setApplications([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [axiosPrivate]);

  // --- CATEGORIZATION LOGIC ---

  // 1. PENDING: Strictly waiting for BFP
  const pendingApplications = useMemo(() => {
    return applications.filter(app => app.status === "Pending BFP");
  }, [applications]);

  // 2. ARCHIVE: Fully completed or Rejected (Passed BFP already)
  const archivedApplications = useMemo(() => {
    return applications.filter(app => 
      ["Approved", "Permit Issued", "Rejected"].includes(app.status)
    );
  }, [applications]);

  // 3. ACTIVE: Pending BFP OR Passed BFP (but not yet Archived/Completed)
  const activeApplications = useMemo(() => {
    return applications.filter(app => 
      !["Approved", "Permit Issued", "Rejected"].includes(app.status)
    );
  }, [applications]);


  // --- Display Logic ---
  const displayedApplications = useMemo(() => {
    let targetList = [];
    
    if (currentPage === "archive") targetList = archivedApplications;
    else if (currentPage === "overview") targetList = pendingApplications; // Overview shows Pending Only
    else targetList = activeApplications; // Applications Tab shows All Active

    return targetList.filter((app) => {
      const matchesStatus = !statusFilter || statusFilter === "All" || app.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const owner = `${app.applicant?.first_name || ""} ${app.applicant?.last_name || ""}`.toLowerCase();
      const ref = (app.referenceNo || "").toLowerCase();
      const matchesSearch = owner.includes(q) || ref.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [activeApplications, archivedApplications, pendingApplications, searchQuery, statusFilter, currentPage]);

  const stats = useMemo(() => {
    return { 
      newApp: pendingApplications.length,
      cleared: archivedApplications.filter(a => a.status !== "Rejected").length, // Completed
      returns: archivedApplications.filter(a => a.status === "Rejected").length // Rejected
    };
  }, [pendingApplications, archivedApplications]);


  const handleUpdateApplication = async (appId, status, payload = {}) => {
    try {
      await axiosPrivate.put(`/api/applications/${appId}/status`, { status, ...payload });
      await fetchData();
      if (selectedApp?._id === appId) {
         setSelectedApp(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error("Failed to update:", err);
      
      // Show specific error message from backend
      const errorMessage = err.response?.data?.message || "Failed to update application status.";
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
    }
  };

  const renderContent = () => {
    if (currentPage === "profile") {
      return <Me />;
    }

    if (currentPage === "calendar" || currentPage === "inspections") {
      return <CalendarPage role={role} onEventsUpdated={fetchData} />;
    }

    // ARCHIVE TAB
    if (currentPage === "archive") {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">BFP Archive (Completed/Rejected)</h3>
          <ApplicationTable
            role={role}
            applications={displayedApplications}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            disableManage={true}
          />
        </div>
      );
    }

    // APPLICATIONS TAB (Active Only)
    if (currentPage === "applications") {
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Active Applications</h3>
            <ApplicationTable
              role={role}
              applications={displayedApplications}
              loading={loading}
              error={error}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onManageClick={(app) => { setSelectedApp(app); setIsWorkflowModalOpen(true); }}
            />
          </div>
        );
    }

    // OVERVIEW (Pending Only)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Welcome BFP Admin</h2>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900">
              BFP <span className="text-red-600">FSEC</span> Dashboard
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DashboardCard label="New Application" count={stats.newApp} color="text-red-600" />
            <DashboardCard label="Cleared/Completed" count={stats.cleared} color="text-blue-600" />
            <DashboardCard label="Returns/Rejected" count={stats.returns} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Pending BFP Queue</h3>
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">{error}</div>}
            
            <ApplicationTable 
               role={role}
               applications={displayedApplications}
               loading={loading}
               searchQuery={searchQuery} 
               setSearchQuery={setSearchQuery}
               onManageClick={(app) => { setSelectedApp(app); setIsWorkflowModalOpen(true); }}
            />
          </div>
        </div>

        <div className="lg:col-span-1 bg-white h-fit min-h-[500px] rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
          <div className="space-y-6 relative">
             <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
             {/* Filter recent activity from ALL relevant applications */}
             {applications
                .flatMap(app => (app.workflowHistory || []).map(e => ({...e, referenceNo: app.referenceNo, timestamp: new Date(e.timestamp)})))
                .filter(e => e.role === "bfpadmin" || (e.comments || "").toLowerCase().includes("bfp"))
                .sort((a,b) => b.timestamp - a.timestamp)
                .slice(0, 8)
                .map((activity, idx) => (
               <div key={idx} className="relative pl-6">
                 <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></div>
                 <p className="text-xs text-gray-400 font-semibold mb-0.5">
                   {activity.timestamp.toLocaleDateString()}
                 </p>
                 <p className="text-sm font-bold text-gray-800">{activity.referenceNo}</p>
                 <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.status}</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen antialiased bg-gray-50 overflow-hidden">
      <DashboardSidebar role={role} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 overflow-y-auto p-6 md:p-12 w-full">
        {renderContent()}
      </div>
      {isWorkflowModalOpen && selectedApp && (
        <WorkflowModal
          role={role}
          app={selectedApp}
          onClose={() => setIsWorkflowModalOpen(false)}
          onUpdate={handleUpdateApplication}
        />
      )}
    </div>
  );
}

function DashboardCard({ label, count, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 transition hover:shadow-md">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{label}</h4>
      <p className={`text-5xl font-bold mt-2 ${color || 'text-gray-900'}`}>{count}</p>
    </div>
  );
}