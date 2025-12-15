// StatusFilter.jsx
import React, { useState, useRef, useEffect } from "react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

export default function StatusFilter({ 
  statusValue = "", 
  typeValue = "", 
  onStatusChange = () => {}, 
  onTypeChange = () => {} 
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("status");
  const ref = useRef(null);

  const statuses = [
    { label: "All Statuses", value: "" },
    { label: "Submitted", value: "Submitted" },
    { label: "Pending BFP", value: "Pending BFP" },
    { label: "Pending MEO", value: "Pending MEO" },
    { label: "Pending Mayor", value: "Pending Mayor" },
    { label: "Payment Pending", value: "Payment Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Permit Issued", value: "Permit Issued" },
    { label: "Rejected", value: "Rejected" },
  ];

  const applicationTypes = [
    { label: "All Types", value: "" },
    { label: "Building Application", value: "Building" },
    { label: "Occupancy Application", value: "Occupancy" },
  ];


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* FILTER BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 flex items-center justify-center rounded-full 
                   bg-white border border-gray-300 shadow-sm hover:shadow-md
                   transition"
      >
        <AdjustmentsHorizontalIcon className="w-6 h-6 text-gray-700" />
      </button>

      {/* POPUP MENU */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* TAB HEADERS */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("status")}
              className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors rounded-tl-xl
                ${activeTab === "status" 
                  ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600" 
                  : "text-gray-500 hover:text-gray-700"}`}
            >
              Status
            </button>
            <button
              onClick={() => setActiveTab("type")}
              className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors rounded-tr-xl
                ${activeTab === "type" 
                  ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600" 
                  : "text-gray-500 hover:text-gray-700"}`}
            >
              Type
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="max-h-64 overflow-y-auto">
            {activeTab === "status" && (
              <div className="py-1">
                {statuses.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      onStatusChange(s.value);
                      setOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors
                      ${statusValue === s.value ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-700"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "type" && (
              <div className="py-1">
                {applicationTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      onTypeChange(t.value);
                      setOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors
                      ${typeValue === t.value ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-700"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
