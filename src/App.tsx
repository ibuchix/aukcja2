
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./pages/Auth";
import DealerDashboard from "./pages/dealer/Dashboard"; 
import CompleteRegistration from "./pages/CompleteRegistration";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/dealer/Profile";
import HowItWorks from "./pages/HowItWorks";
import Marketplace from "./pages/Marketplace";
import Auctions from "./pages/Auctions";
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
              <DealerDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Market pages */}
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        
        {/* Fallback route - redirect to home page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
