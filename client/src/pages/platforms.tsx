import { SocialAccountManager } from "@/components/SocialAccountManager";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default function Platforms() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <DashboardSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-semibold">Platform Management</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your social media accounts and platform settings
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <SocialAccountManager />
        </div>
      </div>
    </div>
  );
}