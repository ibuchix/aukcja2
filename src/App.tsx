
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
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dealer/dashboard"
          element={
            <ProtectedRoute>
              <DealerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complete-registration"
          element={
            <ProtectedRoute>
              <CompleteRegistration />
            </ProtectedRoute>
          }
        />
        {/* Add the test auth route */}
        <Route
          path="/test-auth"
          element={<TestAuth />}
        />
      </Routes>
      <Toaster />
    </AuthProviderWithRouter>
  );
}

export default App;
