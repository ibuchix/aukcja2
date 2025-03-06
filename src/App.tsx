
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Auth from "@/pages/Auth";
import DealerDashboard from "@/pages/dealer/DealerDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import Profile from "@/pages/dealer/Profile";
import DealerProfileManagement from "@/pages/dealer/DealerProfileManagement";
import CompleteRegistration from "@/pages/CompleteRegistration";
import Index from "@/pages/Index";
import HowItWorks from "@/pages/HowItWorks";
import { Toaster } from "@/components/ui/toaster";

// Create the router with routes
const routes = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/how-it-works",
    element: <HowItWorks />,
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
];

// Create the router instance outside of the render function
const router = createBrowserRouter(routes);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
