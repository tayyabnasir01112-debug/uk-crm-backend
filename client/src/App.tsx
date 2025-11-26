import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Business } from "@shared/schema";
import { apiUrl } from "@/lib/api";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Quotations from "@/pages/quotations";
import Invoices from "@/pages/invoices";
import DeliveryChallans from "@/pages/delivery-challans";
import Inventory from "@/pages/inventory";
import Employees from "@/pages/employees";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import FAQ from "@/pages/faq";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-2 border-b border-border shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await fetch(apiUrl("/api/logout"), {
                    method: "POST",
                    credentials: "include",
                  });
                  window.location.replace("/");
                } catch {
                  window.location.replace("/login");
                }
              }}
              className="text-xs"
            >
              Log Out
            </Button>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { data: business, isLoading: businessLoading } = useQuery<Business>({
    queryKey: ["/api/business"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated && location === "/") {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, location, setLocation]);

  if (isLoading || (isAuthenticated && businessLoading)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // SEO pages accessible to everyone (authenticated or not)
  const seoPages = (
    <>
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
    </>
  );

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        {seoPages}
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  if (isAuthenticated && business && !business.onboardingCompleted) {
    return <Onboarding />;
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/quotations" component={Quotations} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/delivery-challans" component={DeliveryChallans} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/employees" component={Employees} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        {seoPages}
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
