import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Auth from "@/pages/Auth";
import DealerDashboard from "@/pages/dealer/DealerDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import Profile from "@/pages/dealer/Profile";
import DealerProfileManagement from "@/pages/dealer/DealerProfileManagement";
import CompleteRegistration from "@/pages/CompleteRegistration";

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: <Auth />,
  },
  {
    path: "/dealer/dashboard",
    element: (
      <ProtectedRoute>
        <DealerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dealer/profile",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dealer/profile-management",
    element: (
      <ProtectedRoute>
        <DealerProfileManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/complete-registration",
    element: <CompleteRegistration />,
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
