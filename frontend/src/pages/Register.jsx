import { useState } from "react";
import SuccessModal from './components/modals/confirmation/SuccessModal';
import { useNavigate } from "react-router-dom";
import { axiosPrivate } from "../api/axios.js";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
  });

  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (e.target.name === "password") {
      const password = e.target.value;
      const errors = [];
      
      if (password.length < 8) errors.push("At least 8 characters");
      if (!/[A-Z]/.test(password)) errors.push("At least 1 uppercase letter");
      if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("At least 1 special character");
      
      setPasswordErrors(errors);
    }
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validatePassword = (password) => {
    const minLength = /.{8,}/;                 
    const hasUppercase = /[A-Z]/;              
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/; 

    if (!minLength.test(password)) {
      return "Password must be at least 8 characters long.";
    }
    if (!hasUppercase.test(password)) {
      return "Password must contain at least 1 uppercase letter.";
    }
    if (!hasSpecial.test(password)) {
      return "Password must contain at least 1 special character.";
    }

    return null; 
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password confirmation check
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Strength check
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await axiosPrivate.post(
        "/api/auth/register",
        {
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone_number,
        }
      );

      console.log("Registration successful:", res.data);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };


  const closeModal = () => setError("");

  return (
    <div className="bg-white text-gray-800 pt-20 pb-20 min-h-screen flex items-center justify-center px-4 md:px-12 font-[Poppins]">
      <div className="grid w-full max-w-6xl grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-20">
        {/* Left Section */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-blue-700 md:text-5xl">
            Start Your Journey
          </h1>
          <p className="mt-2 text-gray-600 text-sm md:text-base pb-8">
            Create an account to start your application process.
          </p>

          {/* Left Section 
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="flex items-center justify-center w-full sm:w-1/2 gap-2 border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <img src="/google.png" className="h-4" alt="Google" />
              Google
            </button>
            <button className="flex items-center justify-center w-full sm:w-1/2 gap-2 border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <img src="/facebook.png" className="h-4" alt="Facebook" />
              Facebook
            </button>
          </div>
      
          <div className="my-6 text-sm text-center text-gray-500">Or</div>
          */}
          <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-2xl shadow-sm">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700"> Username </label>

              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter Username"
                className="mb-4 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required />

            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700"> First Name </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter First Name"
                className="mb-4 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required />

            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700"> Last Name </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter Last Name"
                className="mb-4 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required/>

            <label htmlFor="email" className="block text-sm font-medium text-gray-700"> Email </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Email"
                className="mb-4 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required/>

            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700"> Phone Number </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Enter Phone Number"
                className="mb-4 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required/>

            <label htmlFor="password" className="block text-sm font-medium text-gray-700"> Password </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter Password"
                className="mb-4 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required />

            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700"> Confirm Password </label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="mb-4 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required/>

            <button type="button" onClick={togglePasswordVisibility} className="text-xs text-blue-500">
              {showPassword ? "Hide Passwords" : "Show Passwords"}
            </button>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full rounded-3xl bg-blue-500 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg 
                    className="animate-spin h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>


          <p className="mt-5 text-sm text-center text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 font-semibold hover:underline">
              Login
            </a>
          </p>
        </div>


        <div className="hidden md:flex justify-center">
          <img
            src="/register.png"
            alt="Register Illustration"
            className="w-full max-w-md object-contain"
          />
        </div>
      </div>


      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/login");
        }}
        title="Registration Successful!"
        message="Please check your email to verify your account before logging in."
        buttonText="Go to Login"
      />

      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-80 text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-3">Error</h3>
            <p className="text-gray-700 mb-5">{error}</p>
            <button
              onClick={closeModal}
              className="rounded-2xl bg-blue-500 text-white px-4 py-2 font-medium hover:bg-blue-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

};

export default RegisterPage;