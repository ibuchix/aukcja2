
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// This ProtectedRoute component is no longer needed in App.tsx 
// since we're using the one from /components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

function App() {
  // We're now using Root.tsx as our main router
  // This component is kept simple for backward compatibility
  return (
    <div className="app">
      <Outlet />
    </div>
  );
}

export default App;
