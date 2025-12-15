import axios from '../api/axios.js';
import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LoginPage = ( {setUser} ) => {
    const { setAuth } = useAuth();
    const [formData , setFormData] = useState({
        email: '',
        password: ''
    });

    const [error , setError] = useState(null);
     const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

   const handleSubmit = async (e) => {
        e.preventDefault();
        
        setIsLoading(true);
        setError(null);
        
          try {
            const res = await axios.post("/api/auth/login", formData, {
                withCredentials: true,
            });

            setAuth({
                accessToken: res.data.accessToken,
                role: res.data.user.role,
            });

            console.log("Login Success:", res.data);

            navigate("/");
        } catch (err) {
        console.error("Login error:", err);
        setError(err.response?.data?.message || "Login failed");
    } finally {
        setIsLoading(false);
    }
  };


   const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

   const closeModal = () => setError("");

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">

        <div className="flex flex-col justify-center gap-8 text-center md:text-left">
          <img src="/illustration.jpg" className="mx-auto w-full max-w-md rounded-lg object-cover" alt="Illustration" />
        </div>

        <div className="flex w-full flex-col items-center justify-center">
          <h1 className="text-4xl font-bold tracking-tight text-blue-600 md:text-5xl text-center md:text-left md:mb-6 w-full max-w-md">
            Hello,<br className="hidden md:block" />Welcome Back
          </h1>

          <div className="w-full max-w-md rounded-2xl bg-gray-50 p-8 shadow-xl md:p-10 border border-gray-100 mt-4 md:mt-0">
            <h2 className="text-4xl font-extrabold text-gray-900">Login</h2>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    id="email" 
                    placeholder="Enter Email" 
                    className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    value={formData.password} 
                    onChange={handleChange}
                    id="password" 
                    placeholder="Enter Password" 
                    className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required />
                  <button 
                    type="button" 
                    id="togglePassword" 
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <svg id="eye-open" className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 10.224 7.29 6 12 6s8.577 4.224 9.964 5.683c.21.256.21.638 0 .894C20.577 13.776 16.71 18 12 18s-8.577-4.224-9.964-5.683Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    ) : (
                      <svg id="eye-slashed" className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L6.228 6.228" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-600">Forgot password?</Link>
              </div>

              <button 
                type="submit" 
                id="login-button" 
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
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </button>
            </form>

            <p className="mt-3 text-center text-sm text-gray-600">
              Not you? 
              <a href="register" id="register-link" className="font-medium text-blue-400 hover:text-blue-600"> Create account</a>
            </p>
          </div>
        </div>

      </div>

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
  )
}

export default LoginPage

