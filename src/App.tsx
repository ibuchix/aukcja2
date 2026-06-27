
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./pages/Auth";
import DealerDashboard from "./pages/dealer/Dashboard"; 
import Documents from "./pages/dealer/Documents";
import Bids from "./pages/dealer/Bids";
import Wishlist from "./pages/dealer/Wishlist";
import CarAuction from "./pages/dealer/CarAuction";
import CompleteRegistration from "./pages/CompleteRegistration";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/dealer/Profile";
import Subscription from "./pages/dealer/Subscription";
import HowItWorks from "./pages/HowItWorks";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import PasswordReset from "./pages/PasswordReset";
import PasswordResetWithToken from "./pages/PasswordResetWithToken";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { CookieConsentBanner } from "./components/cookies/CookieConsentBanner";
import { DealerLayoutWrapper } from "./components/dealer/DealerLayoutWrapper";

function App() {
  return (
    <>
      <CookieConsentBanner />
      <Routes>
        {/* Default route now points to the Index page */}
        <Route path="/" element={<Index />} />
        
        {/* Authentication routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/request-password-reset" element={<PasswordReset />} />
        <Route path="/reset-password" element={<PasswordResetWithToken />} />
        <Route
          path="/complete-registration"
          element={
            <ProtectedRoute>
              <CompleteRegistration />
            </ProtectedRoute>
          }
        />
        
        {/* Dealer dashboard routes - wrapped with DealerLayoutWrapper for shared state */}
        <Route
          path="/dealer/dashboard"
          element={
            <ProtectedRoute>
              <DealerLayoutWrapper>
                <DealerDashboard />
              </DealerLayoutWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/profile"
          element={
            <ProtectedRoute>
              <DealerLayoutWrapper>
                <Profile />
              </DealerLayoutWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/bids"
          element={
            <ProtectedRoute>
              <DealerLayoutWrapper>
                <Bids />
              </DealerLayoutWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/documents"
          element={
            <ProtectedRoute>
              <DealerLayoutWrapper>
                <Documents />
              </DealerLayoutWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/wishlist"
          element={
            <ProtectedRoute>
              <DealerLayoutWrapper>
                <Wishlist />
              </DealerLayoutWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/auction/:carId"
          element={
            <ProtectedRoute>
              <DealerLayoutWrapper>
                <CarAuction />
              </DealerLayoutWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/subscription"
          element={
            <ProtectedRoute>
              <DealerLayoutWrapper>
                <Subscription />
              </DealerLayoutWrapper>
            </ProtectedRoute>
          }
        />
        
        {/* Other pages */}
        {/* Temporarily disabled — keep route for future restoration
        <Route path="/how-it-works" element={<HowItWorks />} />
        */}
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
