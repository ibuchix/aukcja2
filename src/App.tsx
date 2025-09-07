
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./pages/Auth";
import DealerDashboard from "./pages/dealer/Dashboard"; 
import Documents from "./pages/dealer/Documents";
import WonVehicles from "./pages/dealer/WonVehicles";
import Bids from "./pages/dealer/Bids";
import CompleteRegistration from "./pages/CompleteRegistration";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/dealer/Profile";
import HowItWorks from "./pages/HowItWorks";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import PasswordReset from "./pages/PasswordReset";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { CookieConsentBanner } from "./components/cookies/CookieConsentBanner";

function App() {
  return (
    <>
      <CookieConsentBanner />
      <Routes>
        {/* Default route now points to the Index page */}
        <Route path="/" element={<Index />} />
        
        {/* Authentication routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route
          path="/complete-registration"
          element={
            <ProtectedRoute>
              <CompleteRegistration />
            </ProtectedRoute>
          }
        />
        
        {/* Dealer dashboard routes */}
        <Route
          path="/dealer/dashboard"
          element={
            <ProtectedRoute>
              <DealerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/bids"
          element={
            <ProtectedRoute>
              <Bids />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/won-vehicles"
          element={
            <ProtectedRoute>
              <WonVehicles />
            </ProtectedRoute>
          }
        />
        
        {/* Other pages */}
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        
        {/* Fallback route - redirect to home page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
