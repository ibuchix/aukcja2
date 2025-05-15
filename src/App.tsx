import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./pages/Auth";
import DealerDashboard from "./pages/DealerDashboard";
import CompleteRegistration from "./pages/CompleteRegistration";
import { AuthProviderWithRouter } from "./contexts/AuthContext";
import { SessionProvider } from "./contexts/SessionContext";
import { Toast } from "@/components/ui/toast"

// Add the import for the test auth page
import TestAuth from "./pages/TestAuth";

function App() {
  return (
    <AuthProviderWithRouter>
      <SessionProvider>
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
      </SessionProvider>
    </AuthProviderWithRouter>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Here you would typically check for authentication status
  // For this example, we'll just return the children
  return <>{children}</>;
}

export default App;
