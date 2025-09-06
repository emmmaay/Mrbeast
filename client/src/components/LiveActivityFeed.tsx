import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: any;
  createdAt: string;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { lastMessage } = useWebSocket();

  const { data: initialActivities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/dashboard/activity'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (initialActivities) {
      setActivities(initialActivities);
    }
  }, [initialActivities]);

  useEffect(() => {
    if (lastMessage?.type === 'new_activity') {
      setActivities(prev => [lastMessage.data, ...prev.slice(0, 9)]);
    }
  }, [lastMessage]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return 'chart-2';
      case 'reply': return 'chart-1';
      case 'engagement': return 'chart-2';
      case 'filter': return 'chart-3';
      case 'rss_update': return 'chart-5';
      case 'ai_processing': return 'chart-3';
      default: return 'chart-1';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="lg:col-span-2 bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Live Activity Feed</h3>
        <p className="text-sm text-muted-foreground">Real-time system actions and events</p>
      </div>
      <div className="p-6">
        <div className="space-y-4 max-h-80 overflow-y-auto" data-testid="activity-feed">
          {activities.length > 0 ? activities.map((activity, index) => (
            <div key={activity.id || index} className="flex items-start gap-3" data-testid={`activity-item-${index}`}>
              <div className={`w-2 h-2 bg-${getActivityIcon(activity.type)} rounded-full mt-2 flex-shrink-0`}></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium" data-testid={`activity-title-${index}`}>
                    {activity.title}
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid={`activity-time-${index}`}>
                    {formatTimeAgo(activity.createdAt)}
                  </span>
                </div>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`activity-description-${index}`}>
                    {activity.description}
                  </p>
                )}
                {activity.metadata && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {activity.metadata.likes && <span>{activity.metadata.likes} likes</span>}
                    {activity.metadata.retweets && <span>{activity.metadata.retweets} retweets</span>}
                    {activity.metadata.threadCount && <span>Auto-threaded ({activity.metadata.threadCount} parts)</span>}
                    {activity.metadata.platforms && <span>{activity.metadata.platforms.join(', ')}</span>}
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center text-muted-foreground py-8">
              <i className="fas fa-clock text-2xl mb-2"></i>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
