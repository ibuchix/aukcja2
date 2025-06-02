import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./pages/Auth";
import DealerDashboard from "./pages/dealer/Dashboard"; 
import Documents from "./pages/dealer/Documents";
import CompleteRegistration from "./pages/CompleteRegistration";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/dealer/Profile";
import HowItWorks from "./pages/HowItWorks";
import Index from "./pages/Index"; // Import Index page

function App() {
  return (
    <>
      <Routes>
        {/* Default route now points to the Index page */}
        <Route path="/" element={<Index />} />
        
        {/* Authentication routes */}
        <Route path="/auth" element={<Auth />} />
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
              <DealerDashboard />
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
        
        {/* Other pages */}
        <Route path="/how-it-works" element={<HowItWorks />} />
        
        {/* Fallback route - redirect to home page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
