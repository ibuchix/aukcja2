
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";

// This ProtectedRoute component is no longer used directly here
// since we're using the one from /components/ProtectedRoute.tsx
function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route 
          path="/dealer/*" 
          element={
            <ProtectedRoute>
              <Navigate to="/dealer/dashboard" replace />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
