import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { envConfig, secureLog } from "@/lib/env-config";
import { CSRFTokenManager } from "@/lib/secure-api";
import Index from "./pages/Index";
import MerchantOnboarding from "./pages/MerchantOnboarding";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Payment from "./pages/Payment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on security-related errors
        if (error instanceof Error && error.message.includes("Rate limit")) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Initialize security configuration
const initializeSecurity = () => {
  // Generate initial CSRF token
  CSRFTokenManager.generateToken();

  // Log security initialization
  secureLog("info", "Security configuration initialized", {
    environment: envConfig.environment,
    features: envConfig.features,
  });

  // Setup session timeout
  let sessionTimeout: NodeJS.Timeout;
  const resetSessionTimeout = () => {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
      secureLog("warn", "Session timeout reached");
      // Clear sensitive data and redirect to login
      sessionStorage.clear();
      window.location.href = "/login";
    }, envConfig.limits.sessionTimeout);
  };

  // Reset timeout on user activity
  ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
    (event) => {
      document.addEventListener(event, resetSessionTimeout, true);
    }
  );

  resetSessionTimeout();
};

const App = () => {
  // Initialize security on app start
  React.useEffect(() => {
    initializeSecurity();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<MerchantOnboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pay" element={<Payment />} />
          <Route path="/pay/:invoiceId" element={<Payment />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);