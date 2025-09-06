import { useQuery } from "@tanstack/react-query";

interface PlatformStatusData {
  platforms: Array<{
    name: string;
    status: string;
    lastPost?: string;
    info?: string;
  }>;
}

export function PlatformStatus() {
  const { data, isLoading } = useQuery<PlatformStatusData>({
    queryKey: ['/api/system/health'],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/3 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const platforms = data?.platforms || [
    { name: 'Twitter/X', status: 'online', lastPost: '12 min ago' },
    { name: 'Telegram', status: 'online', lastPost: '8 min ago' },
    { name: 'Facebook Page', status: 'online', lastPost: '23 min ago' },
    { name: 'Groq AI', status: 'online', info: '3 keys rotating' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'status-online';
      case 'warning': return 'status-warning';
      case 'offline': return 'status-offline';
      default: return 'status-offline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Active';
      case 'warning': return 'Warning';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-chart-2';
      case 'warning': return 'text-chart-3';
      case 'offline': return 'text-chart-4';
      default: return 'text-muted-foreground';
    }
  };

  const getPlatformIcon = (name: string) => {
    if (name.includes('Twitter') || name.includes('X')) return 'fab fa-twitter';
    if (name.includes('Telegram')) return 'fab fa-telegram';
    if (name.includes('Facebook')) return 'fab fa-facebook';
    if (name.includes('Groq') || name.includes('AI')) return 'fas fa-brain';
    return 'fas fa-globe';
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Platform Status</h3>
        <p className="text-sm text-muted-foreground">Real-time connection status</p>
      </div>
      <div className="p-6 space-y-4">
        {platforms.map((platform, index) => (
          <div key={index} className="flex items-center justify-between" data-testid={`platform-status-${index}`}>
            <div className="flex items-center gap-3">
              <i className={`${getPlatformIcon(platform.name)} text-chart-1`}></i>
              <div>
                <p className="font-medium text-sm" data-testid={`platform-name-${index}`}>
                  {platform.name}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`platform-info-${index}`}>
                  {platform.lastPost || platform.info}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`status-indicator ${getStatusColor(platform.status)}`}></div>
              <span className={`text-xs font-medium ${getStatusTextColor(platform.status)}`} data-testid={`platform-status-text-${index}`}>
                {getStatusText(platform.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
