import { useState } from "react";
import SuccessModal from '../components/modals/confirmation/SuccessModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import axios from "../../api/axios.js";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      setMessage(res.data.message); setShowSuccessModal(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error sending email"); setShowErrorModal(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">

        <h2 className="text-2xl font-bold text-center text-blue-700 mb-4">
          Forgot Password
        </h2>

        <p className="text-gray-600 text-center text-sm mb-6">
          Enter your email and we’ll send you a link to reset your password.
        </p>        

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Send Reset Email
          </button>
        </form>

        {message && (
          <div className="mt-4 text-green-600 text-center">{message}</div>
        )}
        {error && (
          <div className="mt-4 text-red-600 text-center">{error}</div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;







