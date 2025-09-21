import { Switch, Route, Redirect, useLocation } from "@/lib/router";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StripeProvider } from "@/components/stripe-provider";
import { useAuth } from "@/hooks/useAuth";
import { useTenant, TenantProvider } from "@/contexts/tenant-context";

// Pages
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Customers from "@/pages/customers";
import SalesPOS from "@/pages/sales-pos";
import Delivery from "@/pages/delivery";
import Loyalty from "@/pages/loyalty";
import Credit from "@/pages/credit";
import Payments from "@/pages/payments";
import Settings from "@/pages/settings";
import SuperAdmin from "@/pages/super-admin";
import KBManagement from "@/pages/admin/kb-management";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";

/**
 * Renders the appropriate layout based on the user's authentication status and tenant selection.
 *
 * The function first checks if the authentication process is still loading, displaying a loading spinner if so.
 * If the user is not authenticated, it shows a marketing landing page with a redirect to the login page.
 * If the user is authenticated but no tenant is selected, it presents a tenant selector.
 * Finally, for authenticated users with a selected tenant, it renders the main application layout with various routes.
 */
function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentTenant } = useTenant();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show marketing landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/app" component={() => <Redirect to="/api/login" />} />
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show tenant selector if no tenant is selected
  if (!currentTenant) {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route component={() => <Redirect to="/" />} />
      </Switch>
    );
  }

  // Show main application with all routes for authenticated users with selected tenant
  return (
    <MainLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/customers" component={Customers} />
        <Route path="/sales" component={SalesPOS} />
        <Route path="/delivery" component={Delivery} />
        <Route path="/loyalty" component={Loyalty} />
        <Route path="/credit" component={Credit} />
        <Route path="/payments" component={Payments} />
        <Route path="/settings" component={Settings} />
        <Route path="/super-admin" component={SuperAdmin} />
        <Route path="/admin/kb-management" component={KBManagement} />
        <Route path="/help" component={Help} />
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

/**
 * Renders the main application component with various providers.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <StripeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </StripeProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}

export default App;
