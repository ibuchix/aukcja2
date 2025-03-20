
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/dealer/Dashboard";
import Profile from "./pages/dealer/Profile";
import Documents from "./pages/dealer/Documents";
import BidMonitoring from "./pages/dealer/BidMonitoring";

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Use Outlet to render nested child routes
  return children ? <>{children}</> : <Outlet />;
};

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/">
        <Route path="auth" element={<Auth />} />
        <Route
          path="/"
          element={<Navigate to="/dealer" replace />}
        />
        <Route path="dealer" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="documents" element={<Documents />} />
          <Route path="bid-monitoring" element={<BidMonitoring />} />
        </Route>
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;
