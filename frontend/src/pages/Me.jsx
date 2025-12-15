import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import axios from "axios";
import ConfirmationModal from "./components/modals/ConfirmationModal.jsx";
import SuccessModal from "./components/modals/confirmation/SuccessModal.jsx";

const Me = () => {
  const { auth } = useAuth();

  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [showImageConfirmModal, setShowImageConfirmModal] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!auth?.accessToken) return;

    axios
      .get("/api/users/me", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      })
      .then((res) => {
        setProfile(res.data);
        setFormData(res.data);
      })
      .catch((err) => setError("Failed to load profile"));
  }, [auth]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview and open confirmation modal
    setPreviewImage(URL.createObjectURL(file));
    setPendingImageFile(file);
    setShowImageConfirmModal(true);
  };

  const confirmImageChange = () => {
    setFormData({ ...formData, profileImageFile: pendingImageFile });
    setShowImageConfirmModal(false);
  };

  const cancelImageChange = () => {
    setPreviewImage(null);
    setPendingImageFile(null);
    setShowImageConfirmModal(false);
  };

  const handleSave = async () => {
    try {
      const submitData = new FormData();
      submitData.append("first_name", formData.first_name);
      submitData.append("last_name", formData.last_name);
      submitData.append("phone_number", formData.phone_number);

      if (formData.profileImageFile) {
        submitData.append("profileImage", formData.profileImageFile);
      }

      const res = await axios.put("/api/users/me", submitData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile(res.data.user);
      setEditMode(false);
      setPreviewImage(null);
      setSuccessMessage("Profile updated successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to update profile");
      setShowErrorModal(true);
    }
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!formData.oldPassword || !formData.newPassword) {
      setErrorMessage("Please fill in both old and new password fields");
      setShowErrorModal(true);
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long");
      setShowErrorModal(true);
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setErrorMessage("New password and confirmation do not match");
      setShowErrorModal(true);
      return;
    }

    try {
      await axios.put(
        "/api/users/change-password",
        {
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }
      );

      setSuccessMessage("Password updated successfully!");
      setShowSuccessModal(true);
      setFormData({ 
        ...formData, 
        oldPassword: "", 
        newPassword: "", 
        confirmNewPassword: "" 
      });

    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to update password");
      setShowErrorModal(true);
    }
  };


  if (!profile) return <p className="text-center mt-10">Loading...</p>;

  const profileImgSrc = previewImage
    ? previewImage
    : profile.profileImage
    ? `data:${profile.profileImageType};base64,${profile.profileImage}`
    : "/default_avatar.png";

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-6">
        <img
          src={profileImgSrc}
          className="w-24 h-24 rounded-full object-cover"
        />

        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-gray-500">{profile.role}</p>
          <p className="text-gray-400 text-sm">{profile.email}</p>
        </div>

        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
          Change Photo
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>
      </div>

      {/* Personal Information */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-semibold">Personal Information</h3>
          <button
            className="text-blue-600 font-medium"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-500 text-sm">First Name</p>
            {editMode ? (
              <input
                className="border rounded p-2 w-full"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            ) : (
              <p className="font-medium">{profile.first_name}</p>
            )}
          </div>

          <div>
            <p className="text-gray-500 text-sm">Last Name</p>
            {editMode ? (
              <input
                className="border rounded p-2 w-full"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
            ) : (
              <p className="font-medium">{profile.last_name}</p>
            )}
          </div>

          <div>
            <p className="text-gray-500 text-sm">Phone Number</p>
            {editMode ? (
              <input
                className="border rounded p-2 w-full"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone_number: e.target.value,
                  })
                }
              />
            ) : (
              <p className="font-medium">{profile.phone_number}</p>
            )}
          </div>
        </div>

        {editMode && (
          <div className="mt-6 flex justify-end">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow"
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Password Change Section */}
      <div className="bg-white p-6 rounded-xl shadow mt-6">
        <h3 className="text-xl font-semibold mb-4">Change Password</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Old Password
              </label>
              <input
                type="password"
                placeholder="Enter old password"
                value={formData.oldPassword || ""}
                className="border rounded p-2 w-full"
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={formData.newPassword || ""}
                className="border rounded p-2 w-full"
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={formData.confirmNewPassword || ""}
                className="border rounded p-2 w-full"
                onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePasswordChange}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Image Confirmation Modal */}
      <ConfirmationModal
        isOpen={showImageConfirmModal}
        onClose={cancelImageChange}
        title="Change Profile Picture"
        message={
          <div className="text-center">
            <p className="mb-4">Do you want to change your profile picture to this image?</p>
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-blue-500"
              />
            )}
          </div>
        }
        confirmText="Yes, Change Picture"
        cancelText="Cancel"
        onConfirm={confirmImageChange}
        type="info"
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message={successMessage}
        buttonText="OK"
      />

      {/* Error Modal */}
      <ConfirmationModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        confirmText="OK"
        onConfirm={() => setShowErrorModal(false)}
        type="error"
      />
    </div>
  );
};

export default Me;
