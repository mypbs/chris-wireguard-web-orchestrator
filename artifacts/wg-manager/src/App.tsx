import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe, useGetSetupStatus, getGetMeQueryKey } from "@workspace/api-client-react";
import { useEffect } from "react";

// Pages
import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import Setup from "./pages/setup";
import NodeNew from "./pages/node-new";
import NodeDetail from "./pages/node-detail";
import NodeSetup from "./pages/node-setup";
import NodeImport from "./pages/node-import";
import ClientDetail from "./pages/client-detail";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: setupStatus, isLoading: setupLoading } = useGetSetupStatus();
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe({ 
    query: { 
      queryKey: getGetMeQueryKey(),
      retry: false 
    } 
  });

  useEffect(() => {
    if (setupLoading || userLoading) return;
    
    const path = window.location.pathname;
    const isAuthRoute = path === "/login" || path === "/setup";
    
    if (setupStatus?.setupRequired) {
      if (path !== "/setup") setLocation("/setup");
      return;
    }

    if (userError || !user) {
      if (!isAuthRoute) setLocation("/login");
      return;
    }

    if (user && isAuthRoute) {
      setLocation("/dashboard");
    }
  }, [setupStatus, user, userError, setupLoading, userLoading, setLocation]);

  if (setupLoading || userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono text-sm text-muted-foreground">
        Initializing...
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => {
        const [, setLocation] = useLocation();
        useEffect(() => setLocation("/dashboard"), [setLocation]);
        return null;
      }} />
      <Route path="/login" component={Login} />
      <Route path="/setup" component={Setup} />
      
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/nodes/new" component={NodeNew} />
      <Route path="/nodes/:nodeId" component={NodeDetail} />
      <Route path="/nodes/:nodeId/setup" component={NodeSetup} />
      <Route path="/nodes/:nodeId/import" component={NodeImport} />
      <Route path="/nodes/:nodeId/clients/:clientId" component={ClientDetail} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGuard>
            <Router />
          </AuthGuard>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
