
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProviderWithRouter } from "@/contexts/auth/AuthProvider";
import Auth from "@/pages/Auth";
import DealerDashboard from "@/pages/dealer/DealerDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import DealerProfileManagement from "@/pages/dealer/DealerProfileManagement";
import CompleteRegistration from "@/pages/CompleteRegistration";
import Index from "@/pages/Index";
import HowItWorks from "@/pages/HowItWorks";
import { Toaster } from "@/components/ui/toaster";

// Create a layout component that includes AuthProviderWithRouter
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviderWithRouter>
      {children}
      <Toaster />
    </AuthProviderWithRouter>
  );
}

// Create the router with routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><Index /></Layout>,
  },
  {
    path: "/auth",
    element: <Layout><Auth /></Layout>,
  },
  {
    path: "/how-it-works",
    element: <Layout><HowItWorks /></Layout>,
  },
  {
    path: "/dealer/dashboard",
    element: (
      <Layout>
        <ProtectedRoute>
          <DealerDashboard />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/dealer/profile-management",
    element: (
      <Layout>
        <ProtectedRoute>
          <DealerProfileManagement />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/complete-registration",
    element: <Layout><CompleteRegistration /></Layout>,
  },
]);

function Root() {
  return <RouterProvider router={router} />;
}

export default Root;
