import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import NavBar from "./pages/components/NavBar";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import PrivateRoute from "./pages/components/PrivateRoute";
import Home from "./pages/Home";
import MeoDashboard from "./pages/Dashboard/MeoDashboard";
import BfpDashboard from "./pages/Dashboard/BfpDashboard";
import MayorDashboard from "./pages/Dashboard/MayorDashboard";
import Me from "./pages/Me.jsx";
import BuildingApplication from "./pages/Applications/BuildingApplication.jsx"
import OccupancyApplication from "./pages/Applications/OccupancyApplication.jsx";
import TrackApplication from './pages/Applications/Tracking/TrackApplication.jsx';
import PaymentPage from './pages/Applications/PaymentPage';
import ReuploadPage from './pages/Applications/ReuploadPage';
import Checklist from "./pages/Applications/Checklist.jsx";
import DocumentUpload from './pages/Applications/DocumentUpload';
import VerifyEmail from './pages/components/VerifyEmail';
import ForgotPassword from "./pages/registration/ForgotPassword";
import ResetPassword from "./pages/registration/ResetPassword";

const Layout = ({ children }) => {
  const location = useLocation();
  const { auth } = useAuth();

  const isAdmin = auth?.role === "meoadmin" || auth?.role === "bfpadmin" || auth?.role === "mayoradmin";

  const hideNav = 
    location.pathname === "/login" || 
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password") ||
    location.pathname.startsWith("/verify-email") ||
    (location.pathname === "/" && isAdmin); 

  return (
    <>
      {!hideNav && <NavBar />}
      {children}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Layout> 
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element=
              {<PrivateRoute>
                {(auth) => {
                    if (auth.role === "meoadmin") return <MeoDashboard />;
                    if (auth.role === "bfpadmin") return <BfpDashboard />;
                    if (auth.role === "mayoradmin") return <MayorDashboard />;
                    return <Home />; 
                  }}
              </PrivateRoute>} />
              <Route
                path="/me"
                element={
                  <PrivateRoute>
                    <Me />
                  </PrivateRoute>
              }/>
              <Route 
                path="/building-application" 
                element={
                  <PrivateRoute>
                    <BuildingApplication />
                  </PrivateRoute>
              }/>
              <Route 
                path="/occupancy-application" 
                element={
                  <PrivateRoute>
                    <OccupancyApplication />
                  </PrivateRoute>
                } />
                
              <Route 
                path="/occupancy-application/:buildingId" 
                element={
                  <PrivateRoute>
                    <OccupancyApplication />
                  </PrivateRoute>
                } />

              <Route path="/checklist" element={<Checklist />} />
              <Route path="/track" element={<TrackApplication />} />
              <Route path="/track/:id" element={<TrackApplication />} />
              <Route path="/application/payment/:id" element={<PaymentPage />} />
              <Route path="/application/reupload/:id" element={<ReuploadPage />} />
              <Route 
                path="/application/documents/:id" 
                element={
                  <PrivateRoute>
                    <DocumentUpload />
                  </PrivateRoute>
                } 
              />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

            </Routes>
          </Layout>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


