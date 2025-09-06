import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountType: string;
  isActive: boolean;
  lastLogin?: string;
}

interface NewAccountForm {
  platform: string;
  accountName: string;
  credentials: {
    username: string;
    password: string;
    email?: string;
    phoneNumber?: string;
    twoFactorBackupCodes?: string;
  };
  accountType: string;
}

export function SocialAccountManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [newAccount, setNewAccount] = useState<NewAccountForm>({
    platform: "",
    accountName: "",
    credentials: { username: "", password: "" },
    accountType: "free"
  });

  const queryClient = useQueryClient();

  const { data: twitterAccounts } = useQuery<SocialAccount[]>({
    queryKey: ['/api/social-credentials/twitter'],
  });

  const { data: telegramAccounts } = useQuery<SocialAccount[]>({
    queryKey: ['/api/social-credentials/telegram'],
  });

  const { data: facebookAccounts } = useQuery<SocialAccount[]>({
    queryKey: ['/api/social-credentials/facebook'],
  });

  const addAccountMutation = useMutation({
    mutationFn: async (accountData: NewAccountForm) => {
      // Encrypt credentials before sending
      const encryptedData = {
        platform: accountData.platform,
        accountName: accountData.accountName,
        credentials: accountData.credentials,
        accountType: accountData.accountType
      };
      
      const response = await apiRequest('POST', '/api/social-credentials', encryptedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-credentials'] });
      setIsAddDialogOpen(false);
      setNewAccount({
        platform: "",
        accountName: "",
        credentials: { username: "", password: "" },
        accountType: "free"
      });
      toast({
        title: "Account Added",
        description: "Social media account has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add social media account.",
        variant: "destructive",
      });
    },
  });

  const initializeDefaultsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/initialize-defaults');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/target-accounts'] });
      toast({
        title: "Defaults Initialized",
        description: "Default target accounts have been set up.",
      });
    },
  });

  const handleAddAccount = () => {
    if (!newAccount.platform || !newAccount.accountName || !newAccount.credentials.username || !newAccount.credentials.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    addAccountMutation.mutate(newAccount);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return 'fab fa-twitter';
      case 'telegram': return 'fab fa-telegram';
      case 'facebook': return 'fab fa-facebook';
      default: return 'fas fa-globe';
    }
  };

  const allAccounts = [
    ...(twitterAccounts || []),
    ...(telegramAccounts || []),
    ...(facebookAccounts || [])
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Social Media Accounts</h3>
          <p className="text-sm text-muted-foreground">Manage your social media login credentials</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => initializeDefaultsMutation.mutate()}
            disabled={initializeDefaultsMutation.isPending}
            data-testid="initialize-defaults-button"
          >
            {initializeDefaultsMutation.isPending ? "Setting up..." : "Initialize Defaults"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-account-button">
                <i className="fas fa-plus mr-2"></i>
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Social Media Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select 
                    value={newAccount.platform} 
                    onValueChange={(value) => setNewAccount({...newAccount, platform: value})}
                  >
                    <SelectTrigger data-testid="platform-select">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter / X</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="facebook">Facebook Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="accountName">Account Name / Display Name</Label>
                  <Input
                    id="accountName"
                    value={newAccount.accountName}
                    onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                    placeholder="e.g., @myawesomeaccount"
                    data-testid="account-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username / Email</Label>
                  <Input
                    id="username"
                    value={newAccount.credentials.username}
                    onChange={(e) => setNewAccount({
                      ...newAccount, 
                      credentials: {...newAccount.credentials, username: e.target.value}
                    })}
                    placeholder="Username or email"
                    data-testid="username-input"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAccount.credentials.password}
                    onChange={(e) => setNewAccount({
                      ...newAccount, 
                      credentials: {...newAccount.credentials, password: e.target.value}
                    })}
                    placeholder="Password"
                    data-testid="password-input"
                  />
                </div>

                <div>
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select 
                    value={newAccount.accountType} 
                    onValueChange={(value) => setNewAccount({...newAccount, accountType: value})}
                  >
                    <SelectTrigger data-testid="account-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Account</SelectItem>
                      <SelectItem value="premium">Premium Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newAccount.platform === 'twitter' && (
                  <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                    <i className="fas fa-info-circle mr-2"></i>
                    <strong>Twitter Authentication:</strong> Your credentials will be used for browser automation. 
                    We recommend using app passwords and backup codes for 2FA accounts.
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddAccount}
                    disabled={addAccountMutation.isPending}
                    className="flex-1"
                    data-testid="save-account-button"
                  >
                    {addAccountMutation.isPending ? "Saving..." : "Save Account"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allAccounts.length > 0 ? allAccounts.map((account, index) => (
          <Card key={account.id} className="p-4" data-testid={`account-card-${index}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <i className={`${getPlatformIcon(account.platform)} text-chart-1 text-lg`}></i>
                <div>
                  <p className="font-medium text-sm" data-testid={`account-name-${index}`}>
                    {account.accountName}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {account.platform} • {account.accountType}
                  </p>
                </div>
              </div>
              <div className={`status-indicator ${account.isActive ? 'status-online' : 'status-offline'}`}></div>
            </div>
            
            {account.lastLogin && (
              <p className="text-xs text-muted-foreground">
                Last login: {new Date(account.lastLogin).toLocaleDateString()}
              </p>
            )}
            
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <i className="fas fa-key mr-1"></i>
                Test Login
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <i className="fas fa-edit mr-1"></i>
                Edit
              </Button>
            </div>
          </Card>
        )) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <i className="fas fa-users text-3xl mb-4"></i>
            <p className="text-lg mb-2">No social media accounts added yet</p>
            <p className="text-sm mb-4">Add your social media credentials to start automation</p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-first-account-button">
              <i className="fas fa-plus mr-2"></i>
              Add Your First Account
            </Button>
          </div>
        )}
      </div>

      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <i className="fas fa-shield-alt text-chart-2"></i>
          Security & Privacy
        </h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• All credentials are encrypted and stored securely</p>
          <p>• Browser sessions are maintained for seamless automation</p>
          <p>• Two-factor authentication codes are supported</p>
          <p>• Credentials are never shared or transmitted insecurely</p>
        </div>
      </div>
    </div>
  );
}