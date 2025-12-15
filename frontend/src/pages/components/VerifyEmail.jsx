import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../api/axios.js";
import SuccessModal from "./modals/confirmation/SuccessModal";
import ConfirmationModal from "./modals/ConfirmationModal";

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [email, setEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      const verifiedTokens = JSON.parse(localStorage.getItem('verifiedTokens') || '[]');
      if (verifiedTokens.includes(token)) {
        if (isMounted) {
          setStatus("already-verified");
        }
        return;
      }

      try {
        await axios.get(`/api/auth/verify-email/${token}`, {
          withCredentials: false,  
          headers: { Authorization: "" } 
        });

        
        if (isMounted) {
          setStatus("success");
          const updatedTokens = [...verifiedTokens, token];
          localStorage.setItem('verifiedTokens', JSON.stringify(updatedTokens));
        }
      } catch (err) {
          const msg = err.response?.data?.message || "Verification failed";
          setErrorMessage(msg);

          if (msg.includes("already been used")) {
            setStatus("already-verified");
          } 
          else if (msg.includes("expired")) {
            setStatus("expired");
          } 
          else {
            setStatus("error");
          }
        }
    };

    if (token) {
        verify();
    } else {
        setStatus("error");
    }

    return () => { isMounted = false; };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendMsg("");
    setResendError("");
    try {
      const res = await axios.post("/api/auth/resend-verification", { email });
      setResendMsg(res.data.message || "A new verification email has been sent.");
      setShowSuccessModal(true);
    } catch (err) {
      setResendError(err.response?.data?.message || "Failed to resend verification email.");
      setShowErrorModal(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-10 font-[Poppins]">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
        {status === "loading" && (
          <div className="flex flex-col items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="py-4 animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-8">Your account has been successfully verified.</p>
            <Link 
              to="/login" 
              className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === "expired" && (
          <div className="py-4 animate-fade-in">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Link Expired</h1>
            <p className="text-gray-600 mb-6">This verification link has expired.</p>
            
            <form onSubmit={handleResend} className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter your email for a new link</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
              >
                Resend Verification Email
              </button>
            </form>
          </div>
        )}

        {status === "already-verified" && (
          <div className="py-4 animate-fade-in">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Already Verified!</h1>
            <p className="text-gray-600 mb-8">This account has already been verified. You can now login.</p>
            <Link 
              to="/login" 
              className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="py-4 animate-fade-in">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-8">{errorMessage || "The link is invalid or has already been used."}</p>
            <Link 
              to="/register" 
              className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Back to Registration
            </Link>
          </div>
        )}
      </div>

      {/* Modals */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setEmail("");
        }}
        title="Email Sent"
        message={resendMsg}
        buttonText="OK"
      />
      <ConfirmationModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={resendError}
        confirmText="OK"
        onConfirm={() => setShowErrorModal(false)}
      />
    </div>
  );
};

export default VerifyEmail;