import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface AutomationConfig {
  autoPosting: boolean;
  aiReplies: boolean;
  autoEngagement: boolean;
  crossPlatform: boolean;
}

export function AutomationControls() {
  const queryClient = useQueryClient();
  
  const { data: configs, isLoading } = useQuery<any[]>({
    queryKey: ['/api/configurations'],
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (config: { key: string; value: any; description?: string }) => {
      const response = await apiRequest('POST', '/api/configurations', config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/configurations'] });
      toast({
        title: "Configuration Updated",
        description: "Automation settings have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration.",
        variant: "destructive",
      });
    },
  });

  // Extract current configuration values
  const getConfigValue = (key: string, defaultValue: boolean = true) => {
    const config = configs?.find(c => c.key === key);
    return config?.value?.enabled ?? defaultValue;
  };

  const handleToggle = (key: string, enabled: boolean, description: string) => {
    updateConfigMutation.mutate({
      key,
      value: { enabled },
      description
    });
  };

  const automationSettings = [
    {
      key: "auto_posting",
      label: "Auto-Posting",
      description: "Automatically post new content across platforms",
      value: getConfigValue("auto_posting"),
    },
    {
      key: "ai_replies",
      label: "AI Replies",
      description: "Generate and send AI-powered replies to comments",
      value: getConfigValue("ai_replies"),
    },
    {
      key: "auto_engagement",
      label: "Auto-Engagement",
      description: "Automatically like, retweet, and comment on target accounts",
      value: getConfigValue("auto_engagement"),
    },
    {
      key: "cross_platform",
      label: "Cross-Platform",
      description: "Share content across all connected platforms",
      value: getConfigValue("cross_platform"),
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-5 w-9 bg-muted rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Automation Controls</h3>
      <div className="space-y-4">
        {automationSettings.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between" data-testid={`automation-${setting.key}`}>
            <div>
              <label className="text-sm font-medium">{setting.label}</label>
              <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
            </div>
            <Switch
              checked={setting.value}
              onCheckedChange={(checked) => 
                handleToggle(setting.key, checked, setting.description)
              }
              disabled={updateConfigMutation.isPending}
              data-testid={`switch-${setting.key}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
