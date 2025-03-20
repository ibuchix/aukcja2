
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
import BrowseCars from "@/pages/BrowseCars";
import { DealerBids } from "@/components/dealer/DealerBids";
import BidMonitoring from "@/pages/dealer/BidMonitoring";
import Dashboard from "@/pages/dealer/Dashboard";
import Profile from "@/pages/dealer/Profile";
import Documents from "@/pages/dealer/Documents";
import { createPersistQueryClientProvider } from "@/utils/cachePersistence";
import { queryClient } from "@/utils/queryClient";
import { TourProvider } from "@/providers/TourProvider";

// Create a persistent query client provider
const PersistQueryClientProvider = createPersistQueryClientProvider(queryClient);

// Create a layout component that includes AuthProviderWithRouter
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider>
      <AuthProviderWithRouter>
        <TourProvider>
          {children}
          <Toaster />
        </TourProvider>
      </AuthProviderWithRouter>
    </PersistQueryClientProvider>
  );
}

// Create the router with routes - public routes first, then protected routes
const router = createBrowserRouter([
  // Public routes that don't require authentication
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
    path: "/browse-cars",
    element: <Layout><BrowseCars /></Layout>,
  },
  {
    path: "/complete-registration",
    element: <Layout><CompleteRegistration /></Layout>,
  },
  
  // Protected dealer routes
  {
    path: "/dealer",
    element: (
      <Layout>
        <ProtectedRoute>
          <DealerDashboard />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/dealer/dashboard",
    element: (
      <Layout>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/dealer/profile",
    element: (
      <Layout>
        <ProtectedRoute>
          <Profile />
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
    path: "/dealer/documents",
    element: (
      <Layout>
        <ProtectedRoute>
          <Documents />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/dealer/bids",
    element: (
      <Layout>
        <ProtectedRoute>
          <DealerBids />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: "/dealer/bid-monitoring",
    element: (
      <Layout>
        <ProtectedRoute>
          <BidMonitoring />
        </ProtectedRoute>
      </Layout>
    ),
  },
]);

function Root() {
  return <RouterProvider router={router} />;
}

export default Root;
