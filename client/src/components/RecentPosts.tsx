import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface PostWithAnalytics {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  status: string;
  createdAt: string;
  threadData?: any;
  analytics?: {
    likes: number;
    shares: number;
    comments: number;
    platforms: string[];
  };
}

export function RecentPosts() {
  const { data: posts, isLoading } = useQuery<PostWithAnalytics[]>({
    queryKey: ['/api/dashboard/recent-posts'],
    refetchInterval: 60000, // Refresh every minute
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ${diffInMinutes % 60}m ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getPlatformIcons = (platforms: string[]) => {
    return platforms.map(platform => {
      switch (platform) {
        case 'twitter': return 'fab fa-twitter';
        case 'telegram': return 'fab fa-telegram';
        case 'facebook': return 'fab fa-facebook';
        default: return 'fas fa-globe';
      }
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

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
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg animate-pulse">
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-muted rounded"></div>
                  <div className="w-4 h-4 bg-muted rounded"></div>
                  <div className="w-4 h-4 bg-muted rounded"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recent Posts</h3>
            <p className="text-sm text-muted-foreground">Latest automated posts across all platforms</p>
          </div>
          <Button variant="secondary" size="sm" data-testid="view-all-posts">
            View All
          </Button>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {posts && posts.length > 0 ? posts.map((post, index) => (
            <div 
              key={post.id} 
              className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg"
              data-testid={`post-item-${index}`}
            >
              <div className="flex items-center gap-2">
                {getPlatformIcons(post.platforms).map((iconClass, iconIndex) => (
                  <i 
                    key={iconIndex} 
                    className={`${iconClass} text-chart-1`}
                    data-testid={`post-platform-${index}-${iconIndex}`}
                  ></i>
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2" data-testid={`post-title-${index}`}>
                  {post.title}
                </p>
                <p className="text-xs text-muted-foreground mb-2" data-testid={`post-content-${index}`}>
                  {truncateContent(post.content)}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span data-testid={`post-time-${index}`}>
                    Posted {formatTimeAgo(post.createdAt)}
                  </span>
                  {post.analytics && (
                    <>
                      <span data-testid={`post-likes-${index}`}>
                        {post.analytics.likes} likes
                      </span>
                      <span data-testid={`post-shares-${index}`}>
                        {post.analytics.shares} retweets
                      </span>
                      <span data-testid={`post-comments-${index}`}>
                        {post.analytics.comments} comments
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground" data-testid={`post-type-${index}`}>
                {post.threadData ? 'Auto-threaded' : 'Single post'}
              </div>
            </div>
          )) : (
            <div className="text-center text-muted-foreground py-8">
              <i className="fas fa-newspaper text-2xl mb-2"></i>
              <p>No posts yet</p>
              <p className="text-xs mt-1">Content will appear here once automation starts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
