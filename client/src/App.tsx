import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Platforms from "@/pages/platforms";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/platforms" component={Platforms} />
      {/* Add other routes here as they're implemented */}
      {/* <Route path="/content" component={ContentFeed} /> */}
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
