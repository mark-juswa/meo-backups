import { useState } from "react";
import SuccessModal from '../components/modals/confirmation/SuccessModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios.js";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post(`/api/auth/reset-password/${token}`, {
        password,
      });

      setMessage(res.data.message);
      setShowSuccessModal(true);

    } catch (err) {
      console.error("Reset password error:", err.response?.data || err.message);
        if (err.response?.status === 400) {
          setError("This reset link is invalid or has expired. Please request a new password reset.");
          setShowErrorModal(true);
        } else {
          setError(err.response?.data?.message || "Reset failed. Please try again.");
          setShowErrorModal(true);
        }
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">

        <h2 className="text-2xl font-bold text-center text-blue-700 mb-4">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            className="w-full p-3 border rounded-lg mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full p-3 border rounded-lg mb-4"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Reset Password
          </button>
        </form>

        {message && (
          <p className="mt-4 text-green-600 text-center">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-red-600 text-center">{error}</p>
        )}        
        {error && error.includes("expired") && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              Need a new reset link? 
              <button 
                onClick={() => navigate("/forgot-password")} 
                className="ml-2 text-blue-600 hover:text-blue-700 underline"
              >
                Click here to request a new one
              </button>
            </p>
          </div>
        )}
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Password Reset Successful!"
        message="Your password has been reset successfully. You can now login with your new password."
        buttonText="Go to Login"
      />

      <ConfirmationModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Reset Failed"
        message={error}
        confirmText="Okay"
        onConfirm={() => setShowErrorModal(false)}
        type="error"
      />
    </div>
  );
};

export default ResetPassword;








