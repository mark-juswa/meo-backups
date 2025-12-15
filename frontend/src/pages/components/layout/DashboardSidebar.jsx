import React, { useState } from 'react';
import { HomeIcon, DocumentTextIcon, CalendarIcon, Bars3Icon, XMarkIcon, UserCircleIcon, ArchiveBoxIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import ConfirmationModal from '../modals/confirmation/Confirm';

const menus = {
  meoadmin: [
    { id: 'overview', label: 'Overview', icon: HomeIcon },
    { id: 'applications', label: 'Applications', icon: DocumentTextIcon },
    { id: 'calendar', label: 'Schedule & Events', icon: CalendarIcon },
    { id: 'archive', label: 'Archive', icon: ArchiveBoxIcon },
    { id: 'users', label: 'Users', icon: UserCircleIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ],
  bfpadmin: [
    { id: 'overview', label: 'Overview', icon: HomeIcon },
    { id: 'applications', label: 'Applications', icon: DocumentTextIcon },
    // { id: 'inspections', label: 'Inspections', icon: CalendarIcon },
    { id: 'archive', label: 'Archive', icon: ArchiveBoxIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ],
  mayoradmin: [
    { id: 'overview', label: 'Overview', icon: HomeIcon },
    { id: 'applications', label: 'Application', icon: DocumentTextIcon },
    { id: 'archive', label: 'Archive', icon: ArchiveBoxIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ],
};


export default function DashboardSidebar({ role = 'meoadmin', currentPage, setCurrentPage }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const items = menus[role] || menus.meoadmin;


  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsLogoutModalOpen(false);
    } catch (err) {
      console.error("Logout failed", err);
      alert("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };


  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border border-gray-200"
        onClick={() => setOpen(true)}>
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static z-50 top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg p-4 w-64 
        flex flex-col
        transform transition-transform duration-300 
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Close button mobile */}
        <button 
          className="lg:hidden mb-4 p-1 absolute top-4 right-4"
          onClick={() => setOpen(false)}>

          <XMarkIcon className="w-6 h-6 text-gray-700" />
        </button>

        <div className="text-center pt-10">
          <img src="/Logo.png" className="w-24 h-24 mx-auto mb-3 object-contain" alt="Logo" />
          <h1 className="text-2xl font-extrabold text-blue-600 tracking-wider">DASHBOARD</h1>
          <p className="text-sm font-medium text-gray-500 capitalize">{role.replace("admin", "")}</p>
        </div>

        <nav className="mt-8 flex-grow space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setOpen(false); 
              }}
              className={`flex w-full items-center p-3 text-sm font-medium rounded-xl transition duration-200 
                ${currentPage === item.id 
                  ? "text-white bg-blue-600" 
                  : "text-gray-600 hover:bg-gray-100"}`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} className="mt-6 w-full px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600"> Logout </button>
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Logout?"
        message="Are you sure you want to log out of the system?"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onClose={() => setIsLogoutModalOpen(false)}
        isProcessing={isLoggingOut}
      />
    </>
  );
}
