import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-chart-line" },
  { name: "Content Feed", href: "/content", icon: "fas fa-newspaper" },
  { name: "Platforms", href: "/platforms", icon: "fas fa-share-alt" },
  { name: "AI Settings", href: "/ai", icon: "fas fa-robot" },
  { name: "Engagement", href: "/engagement", icon: "fas fa-users" },
  { name: "Hashtags", href: "/hashtags", icon: "fas fa-hashtag" },
  { name: "Scheduler", href: "/scheduler", icon: "fas fa-clock" },
  { name: "Analytics", href: "/analytics", icon: "fas fa-chart-bar" },
  { name: "Settings", href: "/settings", icon: "fas fa-cog" },
];

interface DashboardSidebarProps {
  systemStats?: {
    uptime: string;
    postsToday: number;
    apiCalls: number;
  };
}

export function DashboardSidebar({ systemStats }: DashboardSidebarProps) {
  const [location] = useLocation();

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo & System Status */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-bolt text-primary-foreground text-sm"></i>
          </div>
          <div>
            <h1 className="text-sm font-semibold">Tech News Bot</h1>
            <p className="text-xs text-muted-foreground">Oracle Cloud</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="status-indicator status-online"></div>
          <span className="text-muted-foreground">System Online</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" data-testid="sidebar-navigation">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <i className={`${item.icon} w-4`}></i>
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* System Stats */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex justify-between">
            <span>Uptime</span>
            <span className="text-chart-2" data-testid="uptime-display">
              {systemStats ? formatUptime(systemStats.postsToday * 3600) : "7d 14h 32m"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Posts Today</span>
            <span className="text-foreground font-medium" data-testid="posts-today">
              {systemStats?.postsToday || 47}
            </span>
          </div>
          <div className="flex justify-between">
            <span>API Calls</span>
            <span className="text-foreground font-medium" data-testid="api-calls">
              {systemStats?.apiCalls || 1204}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
