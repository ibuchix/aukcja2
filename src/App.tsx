
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import BrowseCars from "./pages/BrowseCars";
import HowItWorks from "./pages/HowItWorks";
import Marketplace from "./pages/Marketplace";
import Auctions from "./pages/Auctions";
import Dashboard from "./pages/dealer/Dashboard";
import DealerDashboard from "./pages/dealer/DealerDashboard";
import Profile from "./pages/dealer/Profile";
import Documents from "./pages/dealer/Documents";
import BidMonitoring from "./pages/dealer/BidMonitoring";
import DealerProfileManagement from "./pages/dealer/DealerProfileManagement";
import CompleteRegistration from "./pages/CompleteRegistration";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/browse-cars" element={<BrowseCars />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
        
        {/* Protected dealer routes */}
        <Route path="/dealer" element={
          <ProtectedRoute>
            <Navigate to="/dealer/dashboard" replace />
          </ProtectedRoute>
        } />
        
        <Route path="/dealer/dashboard" element={
          <ProtectedRoute>
            <DealerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/dealer/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="/dealer/documents" element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } />
        
        <Route path="/dealer/bid-monitoring" element={
          <ProtectedRoute>
            <BidMonitoring />
          </ProtectedRoute>
        } />
        
        <Route path="/dealer/profile-management" element={
          <ProtectedRoute>
            <DealerProfileManagement />
          </ProtectedRoute>
        } />
        
        {/* Handle old dashboard route in case it's referenced elsewhere */}
        <Route path="/dealer/dashboard/old" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
