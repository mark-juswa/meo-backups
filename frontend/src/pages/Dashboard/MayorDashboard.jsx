import React, { useState, useEffect, useMemo } from "react";
import DashboardSidebar from "../components/layout/DashboardSidebar.jsx";
import ApplicationTable from "../components/application/ApplicationTable.jsx";
import WorkflowModal from "../components/modals/WorkflowModal.jsx";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import Me from '../Me.jsx';

export default function MayorDashboard() {
  const role = "mayoradmin";
  const axiosPrivate = useAxiosPrivate();

  // --- State ---
  const [currentPage, setCurrentPage] = useState("overview");
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [selectedApp, setSelectedApp] = useState(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);


  useEffect(() => {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
  }, [currentPage]);


  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, eventsRes] = await Promise.all([
        axiosPrivate.get("/api/applications/all"),
        axiosPrivate.get("/api/events"),
      ]);

      const allApps = appsRes.data?.applications || [];

      const mayorApps = allApps.filter((app) => {
        const status = app.status;

        const isPending = status === "Pending Mayor";

        const hasHistory = (app.workflowHistory || []).some(
          (h) =>
            h.role === "mayoradmin" ||
            (h.comments || "").toLowerCase().includes("mayor") ||
            (h.comments || "").toLowerCase().includes("endorse")
        );

        return isPending || hasHistory;
      });

      setApplications(mayorApps);
      setEvents(eventsRes.data?.events || []);
      setError(null);
    } catch (err) {
      console.error("Error loading mayor dashboard:", err);
      setError("Unable to load mayor dashboard data");
      setApplications([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [axiosPrivate]);

  

  // 1. Pending
  const pendingApplications = useMemo(() => {
    return applications.filter((app) => app.status === "Pending Mayor");
  }, [applications]);

  // 2. Cleared / Archive
  const archivedApplications = useMemo(() => {
    return applications.filter((app) =>
      ["Approved", "Rejected", "Permit Issued"].includes(app.status)
    );
  }, [applications]);

  // 3. Active (Not pending, not archive)
  const activeApplications = useMemo(() => {
    return applications.filter(
      (app) =>
        !["Pending Mayor", "Approved", "Rejected", "Permit Issued"].includes(
          app.status
        )
    );
  }, [applications]);


  const displayedApplications = useMemo(() => {
    let list = [];

    if (currentPage === "archive") list = archivedApplications;
    else if (currentPage === "applications")
      list = [...pendingApplications, ...activeApplications];
    else if (currentPage === "overview") list = pendingApplications;
    else list = applications;

    return list.filter((app) => {
      // Apply status filter
      const matchesStatus =
        !statusFilter || statusFilter === "All" || app.status === statusFilter;

      // Apply type filter
      const matchesType =
        !typeFilter || typeFilter === "All" || app.applicationType === typeFilter;

      // Apply search filter
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (() => {
        const owner = `${app.applicant?.first_name || ""} ${
          app.applicant?.last_name || ""
        }`.toLowerCase();
        const ref = (app.referenceNo || "").toLowerCase();
        return owner.includes(q) || ref.includes(q);
      })();

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [
    applications,
    pendingApplications,
    activeApplications,
    archivedApplications,
    currentPage,
    searchQuery,
    statusFilter,
    typeFilter,
  ]);


  const stats = useMemo(
    () => ({
      newApp: pendingApplications.length,
      cleared: archivedApplications.filter((a) => a.status !== "Rejected")
        .length,
      returns: archivedApplications.filter((a) => a.status === "Rejected")
        .length,
    }),
    [pendingApplications, archivedApplications]
  );

  // Update Status
  const handleUpdateApplication = async (appId, status, payload = {}) => {
    try {
      await axiosPrivate.put(`/api/applications/${appId}/status`, {
        status,
        ...payload,
      });

      await fetchData();

      if (selectedApp?._id === appId) {
        setSelectedApp((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      console.error("Failed to update application:", err);
      
      // Show specific error message from backend
      const errorMessage = err.response?.data?.message || "Failed to update application.";
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

    // Archive Page
    if (currentPage === "archive") {
      return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Cleared Applications
          </h3>
          <ApplicationTable
            role={role}
            applications={displayedApplications}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            disableManage={true}
          />
        </div>
      );
    }

    // Applications Page
    if (currentPage === "applications") {
      return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Applications
          </h3>
          <ApplicationTable
            role={role}
            applications={displayedApplications}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onManageClick={(app) => {
              setSelectedApp(app);
              setIsWorkflowModalOpen(true);
            }}
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        <div className="lg:col-span-3 space-y-8">
          <div>
            <h2 className="text-sm font-bold text-gray-600 uppercase">Welcome Mayor</h2>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900">
              <span className="text-green-600">Mayor's Office</span> Dashboard
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DashboardCard
              label="New Applications"
              count={stats.newApp}
              color="text-blue-600"
            />
            <DashboardCard
              label="Cleared"
              count={stats.cleared}
              color="text-green-600"
            />
            <DashboardCard
              label="Rejected"
              count={stats.returns}
              color="text-red-600"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Pending for Mayor Approval
            </h3>
            <ApplicationTable
              role={role}
              applications={displayedApplications.filter(app => app.status === "Pending Mayor")}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              onManageClick={(app) => {
                setSelectedApp(app);
                setIsWorkflowModalOpen(true);
              }}
            />
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Recent Activity
          </h3>

          <div className="space-y-6 relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200"></div>

            {applications
              .flatMap((app) =>
                (app.workflowHistory || []).map((e) => ({
                  ...e,
                  referenceNo: app.referenceNo,
                  timestamp: new Date(e.timestamp),
                }))
              )
              .filter(
                (e) =>
                  e.role === "mayoradmin" ||
                  (e.comments || "").toLowerCase().includes("mayor") ||
                  (e.comments || "").toLowerCase().includes("endorse")
              )
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 8)
              .map((act, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute left-0 top-2 w-3.5 h-3.5 bg-blue-600 rounded-full"></div>
                  <p className="text-xs text-gray-400">
                    {act.timestamp.toLocaleDateString()}
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {act.referenceNo}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {act.status}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen antialiased bg-gray-50 overflow-hidden">
      <DashboardSidebar
        role={role}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-10 w-full">
        {renderContent()}
      </div>

      {isWorkflowModalOpen && selectedApp && (
        <WorkflowModal
          role={role}
          app={selectedApp}
          onClose={() => {
            setIsWorkflowModalOpen(false);
            setSelectedApp(null);
          }}
          onUpdate={handleUpdateApplication}
        />
      )}
    </div>
  );
}

function DashboardCard({ label, count, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between h-32 transition hover:shadow-md">
      <h4 className="text-sm font-semibold text-gray-500 uppercase">
        {label}
      </h4>
      <p className={`text-5xl font-bold mt-2 ${color || "text-gray-900"}`}>
        {count}
      </p>
    </div>
  );
}
