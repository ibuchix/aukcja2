import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Marketplace from "@/pages/Marketplace";
import DealerDashboard from "@/pages/dealer/Dashboard";
import DealerProfile from "@/pages/dealer/Profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/dealer/dashboard" element={<DealerDashboard />} />
        <Route path="/dealer/profile" element={<DealerProfile />} />
      </Routes>
    </Router>
  );
}

export default App;