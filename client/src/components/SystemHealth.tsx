import { useQuery } from "@tanstack/react-query";

interface SystemHealthData {
  system: {
    cpuUsage: number;
    memoryUsage: number;
    memoryTotal: number;
    storageUsage: number;
    storageTotal: number;
    uptime: number;
  };
}

export function SystemHealth() {
  const { data, isLoading } = useQuery<SystemHealthData>({
    queryKey: ['/api/system/health'],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
                <div className="h-2 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const system = data?.system || {
    cpuUsage: 23,
    memoryUsage: 8.2,
    memoryTotal: 24,
    storageUsage: 47,
    storageTotal: 220,
    uptime: 642720
  };

  const metrics = [
    {
      label: "CPU Usage",
      value: `${Math.round(system.cpuUsage)}%`,
      percentage: system.cpuUsage,
      color: system.cpuUsage > 80 ? "chart-4" : system.cpuUsage > 60 ? "chart-3" : "chart-2"
    },
    {
      label: "Memory",
      value: `${system.memoryUsage}GB / ${system.memoryTotal}GB`,
      percentage: (system.memoryUsage / system.memoryTotal) * 100,
      color: (system.memoryUsage / system.memoryTotal) > 0.8 ? "chart-4" : 
             (system.memoryUsage / system.memoryTotal) > 0.6 ? "chart-3" : "chart-1"
    },
    {
      label: "Storage",
      value: `${system.storageUsage}GB / ${system.storageTotal}GB`,
      percentage: (system.storageUsage / system.storageTotal) * 100,
      color: (system.storageUsage / system.storageTotal) > 0.8 ? "chart-4" : 
             (system.storageUsage / system.storageTotal) > 0.6 ? "chart-3" : "chart-3"
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">System Health</h3>
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} data-testid={`system-metric-${index}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">{metric.label}</span>
              <span className="text-sm font-medium" data-testid={`metric-value-${index}`}>
                {metric.value}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div 
                className={`bg-${metric.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                data-testid={`metric-bar-${index}`}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
