import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TitlesProvider } from "@/contexts/TitlesContext";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import TitleDetails from "./pages/TitleDetails";
import Watch from "./pages/Watch";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Watchlist from "./pages/Watchlist";
import Subscription from "./pages/Subscription";
import HelpCenter from "./pages/HelpCenter";
import HelpPage from "./pages/HelpPage";
import TicketDetail from "./pages/TicketDetail";
import APIDocs from "./pages/APIDocs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// Lazy load admin to reduce bundle exposure
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TitlesProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/title/:id" element={<TitleDetails />} />
            <Route path="/watch/:titleId" element={<Watch />} />
            <Route path="/watch/:titleId/:episodeId" element={<Watch />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<Account />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/support" element={<HelpCenter />} />
            <Route path="/ticket/:id" element={<TicketDetail />} />
            <Route path="/docs" element={<APIDocs />} />
            <Route path="/api-docs" element={<APIDocs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route 
              path="/admin" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Admin />
                </Suspense>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </TitlesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
