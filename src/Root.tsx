
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { createPersistQueryClientProvider } from "./utils/cachePersistence";
import { Suspense } from "react";
import { TourProvider } from "./providers/TourProvider";
import { OnlineStatusProvider } from "./contexts/OnlineStatusContext";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create a persisted version of the query client provider
const PersistQueryClientProvider = createPersistQueryClientProvider(queryClient);

export default function Root() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="light">
        <PersistQueryClientProvider>
          <OnlineStatusProvider>
            <TourProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <App />
                <Toaster />
              </Suspense>
            </TourProvider>
          </OnlineStatusProvider>
        </PersistQueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
