import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { isPreview, settings } from "@/config/settings";
import { routes } from "./routes";
const LoginModal = lazy(() => import("@/components/auth/LoginModal"));

const queryClient = new QueryClient({ defaultOptions: { queries: {
  refetchInterval: isPreview ? false : settings.refreshIntervalMs,
  retry: false,
} } });

function PageLoader() {
  return (
    <div data-page-loader className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {!isPreview && <Suspense fallback={null}><LoginModal /></Suspense>}
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {routes.map(({ path, Page }) => <Route key={path} path={path} element={<Page />} />)}
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
