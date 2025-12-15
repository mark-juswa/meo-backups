import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth info using refresh token cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/api/auth/refresh", { withCredentials: true });

        setAuth({
          accessToken: res.data.accessToken,
          user: res.data.user,
          role: res.data.user?.role || "user",
        });
      } catch (error) {
        console.error("Auth refresh failed:", error);
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // LOGIN function
  const login = async (email, password) => {
    try {
      const res = await axios.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      setAuth({
        accessToken: res.data.accessToken,
        user: res.data.user,
        role: res.data.user?.role,
      });

      return { success: true, user: res.data.user };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  // LOGOUT function
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });

      setAuth(null);

  
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

  
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
