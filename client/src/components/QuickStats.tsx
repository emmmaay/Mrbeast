import { useQuery } from "@tanstack/react-query";

interface StatsData {
  postsToday: number;
  engagementRate: number;
  aiReplies: number;
  activeSources: number;
  totalSources: number;
}

export function QuickStats() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Posts Today",
      value: stats?.postsToday || 0,
      icon: "fas fa-paper-plane",
      color: "chart-1",
      change: "+12%",
      changeType: "positive" as const,
      subtitle: "vs yesterday"
    },
    {
      title: "Engagement Rate",
      value: `${stats?.engagementRate || 0}%`,
      icon: "fas fa-heart",
      color: "chart-2",
      change: "+3.2%",
      changeType: "positive" as const,
      subtitle: "vs last week"
    },
    {
      title: "AI Replies Sent",
      value: stats?.aiReplies || 0,
      icon: "fas fa-robot",
      color: "chart-3",
      change: "-2%",
      changeType: "negative" as const,
      subtitle: "vs yesterday"
    },
    {
      title: "Sources Active",
      value: `${stats?.activeSources || 0}/${stats?.totalSources || 15}`,
      icon: "fas fa-rss",
      color: "chart-5",
      change: `${(stats?.totalSources || 15) - (stats?.activeSources || 0)} sources down`,
      changeType: stats?.activeSources === stats?.totalSources ? "positive" : "warning" as const,
      subtitle: ""
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-6" data-testid={`stat-card-${index}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold" data-testid={`stat-value-${index}`}>
                {stat.value}
              </p>
            </div>
            <div className={`w-10 h-10 bg-${stat.color}/20 rounded-lg flex items-center justify-center`}>
              <i className={`${stat.icon} text-${stat.color}`}></i>
            </div>
          </div>
          <div className="flex items-center mt-4 text-xs">
            {stat.changeType === "positive" && (
              <i className="fas fa-arrow-up text-chart-2 mr-1"></i>
            )}
            {stat.changeType === "negative" && (
              <i className="fas fa-arrow-down text-chart-4 mr-1"></i>
            )}
            {stat.changeType === "warning" && (
              <div className="status-indicator status-warning mr-2"></div>
            )}
            <span 
              className={
                stat.changeType === "positive" ? "text-chart-2" :
                stat.changeType === "negative" ? "text-chart-4" :
                "text-muted-foreground"
              }
            >
              {stat.change}
            </span>
            {stat.subtitle && (
              <span className="text-muted-foreground ml-1">{stat.subtitle}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
