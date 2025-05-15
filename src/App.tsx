
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./pages/Auth";
import DealerDashboard from "./pages/dealer/Dashboard"; 
import CompleteRegistration from "./pages/CompleteRegistration";
import { AuthProviderWithRouter } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";

// Add the import for the test auth page
import TestAuth from "./pages/TestAuth";

function App() {
  return (
    <AuthProviderWithRouter>
      <Routes>
        {/* Default route redirects to /auth */}
        <Route path="/" element={<Navigate to="/auth" />} />
        
        {/* Authentication routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/test-auth" element={<TestAuth />} />
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
              <Navigate to="/dealer/dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/bids"
          element={
            <ProtectedRoute>
              <Navigate to="/dealer/dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/documents"
          element={
            <ProtectedRoute>
              <Navigate to="/dealer/dashboard" />
            </ProtectedRoute>
          }
        />
        
        {/* Market pages */}
        <Route path="/marketplace" element={<Navigate to="/auth" />} />
        <Route path="/auctions" element={<Navigate to="/auth" />} />
        <Route path="/browse" element={<Navigate to="/auth" />} />
        <Route path="/how-it-works" element={<Navigate to="/auth" />} />
        
        {/* Fallback route - redirect to auth */}
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
      <Toaster />
    </AuthProviderWithRouter>
  );
}

export default App;
