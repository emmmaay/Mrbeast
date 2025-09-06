import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      {/* Add other routes here as they're implemented */}
      {/* <Route path="/content" component={ContentFeed} /> */}
      {/* <Route path="/platforms" component={Platforms} /> */}
      {/* <Route path="/ai" component={AISettings} /> */}
      {/* <Route path="/engagement" component={Engagement} /> */}
      {/* <Route path="/hashtags" component={Hashtags} /> */}
      {/* <Route path="/scheduler" component={Scheduler} /> */}
      {/* <Route path="/analytics" component={Analytics} /> */}
      {/* <Route path="/settings" component={Settings} /> */}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
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
