
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DealerDashboard from "./pages/dealer/Dashboard";
import DealerProfile from "./pages/dealer/Profile";
import DealerBids from "./pages/dealer/Bids";
import DealerDocuments from "./pages/dealer/Documents";
import Auctions from "./pages/Auctions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dealer/dashboard" element={<DealerDashboard />} />
          <Route path="/dealer/profile" element={<DealerProfile />} />
          <Route path="/dealer/bids" element={<DealerBids />} />
          <Route path="/dealer/documents" element={<DealerDocuments />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
