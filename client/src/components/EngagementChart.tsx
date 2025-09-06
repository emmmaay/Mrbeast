import { useQuery } from "@tanstack/react-query";

interface EngagementData {
  date: string;
  likes: number;
  shares: number;
  comments: number;
  impressions: number;
}

export function EngagementChart() {
  const { data: engagementData, isLoading } = useQuery<EngagementData[]>({
    queryKey: ['/api/analytics/engagement/7'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="h-80 bg-muted/20 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Engagement Analytics</h3>
            <p className="text-sm text-muted-foreground">7-day performance overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-md" data-testid="chart-period-7d">
              7D
            </button>
            <button className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md" data-testid="chart-period-30d">
              30D
            </button>
            <button className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md" data-testid="chart-period-90d">
              90D
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Chart placeholder with gradient background */}
        <div className="h-80 relative bg-gradient-to-br from-primary/5 to-chart-2/5 rounded-lg border border-border/50">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <i className="fas fa-chart-area text-3xl mb-2"></i>
              <p className="text-sm font-medium">Real-time engagement visualization</p>
              <p className="text-xs mt-1">Charts showing likes, shares, comments, and growth metrics</p>
              
              {/* Mock data display when no chart library is available */}
              {engagementData && engagementData.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                      <span>Likes: {engagementData.reduce((sum, d) => sum + d.likes, 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                      <span>Shares: {engagementData.reduce((sum, d) => sum + d.shares, 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                      <span>Comments: {engagementData.reduce((sum, d) => sum + d.comments, 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
