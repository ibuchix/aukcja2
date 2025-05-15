
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./pages/Auth";
import DealerDashboard from "./pages/dealer/Dashboard"; // Fixed import path
import CompleteRegistration from "./pages/CompleteRegistration";
import { AuthProviderWithRouter } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute component
import { Toast } from "@/components/ui/toast";

// Add the import for the test auth page
import TestAuth from "./pages/TestAuth";

function App() {
  return (
    <AuthProviderWithRouter>
      <Router>
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
      </Router>
      <Toast />
    </AuthProviderWithRouter>
  );
}

export default App;
