import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface NicheConfig {
  current: string;
  keywords: string[];
  targetAccounts: number;
}

export function CurrentNiche() {
  const queryClient = useQueryClient();
  
  const { data: configs } = useQuery<any[]>({
    queryKey: ['/api/configurations'],
  });

  const switchNicheMutation = useMutation({
    mutationFn: async (niche: string) => {
      const response = await apiRequest('POST', '/api/configurations', {
        key: 'current_niche',
        value: { 
          current: niche,
          keywords: getNicheKeywords(niche),
          timestamp: new Date().toISOString()
        },
        description: `Switched to ${niche} niche`
      });
      return response.json();
    },
    onSuccess: (_, niche) => {
      queryClient.invalidateQueries({ queryKey: ['/api/configurations'] });
      toast({
        title: "Niche Switched",
        description: `Successfully switched to ${niche} niche.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to switch niche.",
        variant: "destructive",
      });
    },
  });

  const currentNiche = configs?.find(c => c.key === 'current_niche')?.value?.current || 'Technology';
  
  const getNicheKeywords = (niche: string): string[] => {
    const nicheKeywords: Record<string, string[]> = {
      'Technology': ['AI', 'tech', 'software', 'programming', 'startup', 'innovation'],
      'Crypto': ['bitcoin', 'ethereum', 'blockchain', 'defi', 'nft', 'crypto'],
      'Sports': ['football', 'basketball', 'soccer', 'baseball', 'olympics', 'sports'],
      'Finance': ['market', 'stocks', 'trading', 'investment', 'economy', 'finance']
    };
    return nicheKeywords[niche] || [];
  };

  const availableNiches = ['Technology', 'Crypto', 'Sports', 'Finance'];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Current Niche</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Active Niche</span>
            <span 
              className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-md font-medium"
              data-testid="current-niche-display"
            >
              {currentNiche}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {getNicheKeywords(currentNiche).length} keywords active, 23 target accounts
          </p>
        </div>
        
        <Button 
          variant="secondary" 
          className="w-full" 
          disabled={switchNicheMutation.isPending}
          data-testid="switch-niche-button"
        >
          {switchNicheMutation.isPending ? "Switching..." : "Switch Niche"}
        </Button>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          {availableNiches.filter(niche => niche !== currentNiche).map((niche) => (
            <Button
              key={niche}
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => switchNicheMutation.mutate(niche)}
              disabled={switchNicheMutation.isPending}
              data-testid={`niche-option-${niche.toLowerCase()}`}
            >
              {niche}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
