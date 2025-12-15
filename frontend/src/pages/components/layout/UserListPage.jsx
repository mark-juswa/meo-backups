import React, { useState, useMemo } from "react";
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import { AdjustmentsHorizontalIcon, UserCircleIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import SuccessModal from "../modals/confirmation/SuccessModal";
import DeleteModal from "../modals/confirmation/DeleteModal";

export default function UserListPage({ users = [], loading, onUserUpdated }) {
  const axiosPrivate = useAxiosPrivate();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Manage Modal States 
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("user");
  const [isUpdating, setIsUpdating] = useState(false);

  // Success & Delete Modal States
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: "", message: "" });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null, title: "", message: "" });

  // All roles available
  const roles = [
    { label: "All Roles", value: "" },
    { label: "Client", value: "user" },
    { label: "BFP Admin", value: "bfpadmin" },
    { label: "Mayor Admin", value: "mayoradmin" },
    { label: "MEO Admin", value: "meoadmin" },
  ];

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        `${u.first_name} ${u.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchRole = roleFilter === "" ? true : u.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  

  const openManageModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role); 
    setIsManageModalOpen(true);
  };

  const closeManageModal = () => {
    setIsManageModalOpen(false);
    setSelectedUser(null);
    setIsUpdating(false);
  };


  // UPDATE ROLE FUNCTIONALITY
  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      await axiosPrivate.put(`/api/users/${selectedUser._id}/role`, {
        role: newRole,
      });

      closeManageModal();
      
      setSuccessModal({
        isOpen: true,
        title: "Role Updated!",
        message: `Successfully updated role to ${newRole}.`
      });

      if (onUserUpdated) onUserUpdated(); 

    } catch (error) {
      console.error("Error updating role:", error);
      const errMsg = error.response?.data?.message || "Error updating role. Please try again.";
      alert(errMsg); 
    } finally {
      setIsUpdating(false);
    }
  };

  // DELETE FUNCTIONALITY

  const confirmDeleteUser = () => {
    if (!selectedUser) return;

    setIsManageModalOpen(false);

    setDeleteModal({
        isOpen: true,
        userId: selectedUser._id,
        title: "Delete User?",
        message: `Are you sure you want to delete ${selectedUser.first_name}? This action cannot be undone.`
    });
  };

  // Delete Action
  const handleDeleteUser = async () => {
    if (!deleteModal.userId) return;

    setIsUpdating(true);
    try {
      await axiosPrivate.delete(`/api/users/${deleteModal.userId}`);
      
      // Close Delete Modal
      setDeleteModal({ ...deleteModal, isOpen: false });

      // Show Success Modal
      setSuccessModal({
        isOpen: true,
        title: "User Deleted!",
        message: "The user has been successfully removed from the system."
      });
      
      if (onUserUpdated) onUserUpdated();

    } catch (error) {
      console.error("Error deleting user:", error);
      const errMsg = error.response?.data?.message || "Failed to delete user.";
      alert(errMsg); 
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="card p-6 bg-white rounded-xl shadow-sm border border-gray-200 relative">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Registered Users
      </h2>

      {/* Search + Role Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search user by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full md:w-48 border border-gray-300 rounded-lg text-sm p-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <p className="text-center text-gray-500">Loading users...</p>
      )}

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <p className="text-center text-gray-500">No users found.</p>
      )}

      {/* Table */}
      {!loading && filteredUsers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Registered</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr
                  key={u._id}
                  className="hover:bg-blue-50 transition duration-150"
                >
                  <Td>
                    {u.first_name} {u.last_name}
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold capitalize
                      ${u.role === "meoadmin" ? "bg-purple-100 text-purple-800" :
                        u.role === "bfpadmin" ? "bg-red-100 text-red-800" :
                        u.role === "mayoradmin" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}
                    >
                      {u.role}
                    </span>
                  </Td>
                  <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <button
                      onClick={() => openManageModal(u)}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                    >
                      Manage
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MANAGE USER MODAL */}
      {isManageModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserCircleIcon className="w-6 h-6 text-blue-600" />
                Manage User
              </h3>
              <button onClick={closeManageModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* User Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wide">User Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs">Full Name</span>
                        <span className="font-medium text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs">Username</span>
                        <span className="font-medium text-gray-900">{selectedUser.username}</span>
                    </div>
                    <div className="sm:col-span-2">
                        <span className="block text-gray-500 text-xs">Email Address</span>
                        <span className="font-medium text-gray-900">{selectedUser.email}</span>
                    </div>
                </div>
              </div>

              {/* Assign Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Role</label>
                <div className="flex gap-2">
                    <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                        {roles.filter(r => r.value !== "").map((r) => (
                        <option key={r.value} value={r.value}>
                            {r.label}
                        </option>
                        ))}
                    </select>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              
              <button
                onClick={confirmDeleteUser}
                disabled={isUpdating}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 rounded hover:bg-red-50 transition border border-transparent hover:border-red-200"
              >
                <TrashIcon className="w-5 h-5" />
                Delete User
              </button>

              <div className="flex gap-3">
                <button
                    onClick={closeManageModal}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
                >
                    Cancel
                </button>
                <button
                    onClick={handleUpdateRole}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none flex items-center gap-2 shadow-sm"
                >
                    {isUpdating ? "Saving..." : "Update Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SuccessModal 
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
      />

      <DeleteModal 
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        message={deleteModal.message}
        isDeleting={isUpdating}
        onConfirm={handleDeleteUser}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      />

    </div>
  );
}

const Th = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    {children}
  </th>
);

const Td = ({ children }) => (
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
    {children}
  </td>
);