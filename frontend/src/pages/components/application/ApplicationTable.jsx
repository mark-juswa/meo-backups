import React from 'react';
import StatusBadge from './StatusBadge';
import SearchBar from './SearchBar';
import StatusFilter from './StatusFilter';

export default function ApplicationTable({
  role,
  applications = [],
  loading = false,
  error = null,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  onManageClick,
  disableManage = false
}) {
  
  const displayedApplications = applications;

  return (
    <div id="applications-page" className="page-content">
      <div className="card p-6 bg-white rounded-xl shadow-sm border border-gray-200">

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">All Applications</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />

            {!disableManage && (
              <StatusFilter 
                statusValue={statusFilter} 
                onStatusChange={setStatusFilter}
                typeValue={typeFilter}
                onTypeChange={setTypeFilter}
              />
            )}
          </div>
        </div>


        {/* Content Area */}
        <div>
          {loading && <p className="text-center text-gray-500 py-8">Loading applications...</p>}
          {error && <p className="text-center text-red-500 py-8">{error}</p>}

          {!loading && !error && (
            <>
              {/* DESKTOP VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Reference No</Th>
                      <Th>Owner</Th>
                      <Th>Type</Th>
                      <Th>Submitted</Th>
                      <Th>Status</Th>
                      <Th center>Action</Th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedApplications.length > 0 ? (
                      displayedApplications.map((app) => (
                        <tr key={app._id} className="hover:bg-blue-50 transition duration-150">
                          <Td medium>
                            <div className="flex flex-col gap-1">
                              <span>{app.referenceNo || 'N/A'}</span>
                              {app.permit?.permitNumber && (
                                <span className="text-xs font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded inline-block w-fit">
                                  Permit: {app.permit.permitNumber}
                                </span>
                              )}
                            </div>
                          </Td>
                          <Td>
                            {app.applicant
                              ? `${app.applicant?.first_name || ''} ${app.applicant?.last_name || ''}`
                              : 'N/A'}
                          </Td>
                          <Td>{app.applicationType || app.type || 'N/A'}</Td>
                          <Td>{new Date(app.createdAt).toLocaleDateString()}</Td>
                          <Td><StatusBadge status={app.status} /></Td>
                          
                          <Td center>
                            {disableManage ? (
                              <button
                                disabled
                                className="text-gray-400 cursor-not-allowed font-semibold text-sm"
                              >
                                Manage
                              </button>
                            ) : (
                              <button
                                onClick={() => onManageClick(app)}
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition bg-white"
                              >
                                Manage
                              </button>
                            )}
                          </Td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW */}
              <div className="md:hidden space-y-4">
                {displayedApplications.length > 0 ? (
                  displayedApplications.map((app) => (
                    <div key={app._id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-3">
                      
                      {/* Top Row: Ref No & Status */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Reference No</p>
                          <p className="text-sm font-bold text-gray-900">{app.referenceNo || 'N/A'}</p>
                          {app.permit?.permitNumber && (
                            <p className="text-xs font-mono text-green-700 bg-green-50 px-2 py-1 rounded mt-1 inline-block">
                              Permit: {app.permit.permitNumber}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={app.status} />
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm border-t border-b border-gray-100 py-3">
                        <div>
                          <p className="text-xs text-gray-500">Owner</p>
                          <p className="font-medium text-gray-800">
                             {app.applicant
                              ? `${app.applicant?.first_name || ''} ${app.applicant?.last_name || ''}`
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="font-medium text-gray-800">{app.applicationType || app.type || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="font-medium text-gray-800">{new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="mt-1">
                        {disableManage ? (
                           <button
                             disabled
                             className="w-full py-2 text-center text-gray-400 bg-gray-50 rounded-lg text-sm font-medium cursor-not-allowed border border-gray-200"
                           >
                             Manage Disabled
                           </button>
                        ) : (
                          <button
                            onClick={() => onManageClick(app)}
                            className="w-full py-2 text-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium border border-blue-200 transition-colors"
                          >
                            Manage Application
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No applications found.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


const Th = ({ children, center }) => (
  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase  ${center ? 'text-center' : 'text-left'}`}>
    {children}
  </th>
);


const Td = ({ children, medium, center, right }) => (
  <td
    className={`px-6 py-4 whitespace-nowrap text-sm ${
      medium ? 'font-medium text-gray-900' : 'text-gray-500'
    } ${center ? 'text-center' : ''}`}
  >
    {children}
  </td>
);