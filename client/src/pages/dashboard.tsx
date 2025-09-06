import { DashboardSidebar } from "@/components/DashboardSidebar";
import { QuickStats } from "@/components/QuickStats";
import { PlatformStatus } from "@/components/PlatformStatus";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { EngagementChart } from "@/components/EngagementChart";
import { AutomationControls } from "@/components/AutomationControls";
import { CurrentNiche } from "@/components/CurrentNiche";
import { SystemHealth } from "@/components/SystemHealth";
import { RecentPosts } from "@/components/RecentPosts";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/emergency-stop');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/configurations'] });
      toast({
        title: "Emergency Stop Activated",
        description: "All automation systems have been stopped.",
        variant: "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate emergency stop.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex h-screen bg-background text-foreground">
      <DashboardSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time monitoring and controls for your automation system
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className={`status-indicator ${isConnected ? 'status-online' : 'status-offline'}`}></div>
                <span className="text-muted-foreground">
                  {isConnected ? 'System Connected' : 'System Disconnected'}
                </span>
              </div>
              <Button 
                variant="destructive"
                onClick={() => emergencyStopMutation.mutate()}
                disabled={emergencyStopMutation.isPending}
                data-testid="emergency-stop-button"
              >
                {emergencyStopMutation.isPending ? "Stopping..." : "Emergency Stop"}
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <QuickStats />

          {/* Platform Status & Live Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PlatformStatus />
            <LiveActivityFeed />
          </div>

          {/* Engagement Analytics Chart */}
          <EngagementChart />

          {/* Quick Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AutomationControls />
            <CurrentNiche />
            <SystemHealth />
          </div>

          {/* Recent Posts Preview */}
          <RecentPosts />
        </div>
      </div>
    </div>
  );
}
