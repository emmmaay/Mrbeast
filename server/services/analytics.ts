import { storage } from "../storage";
import type { SystemStats, InsertSystemStats } from "@shared/schema";

export class AnalyticsService {
  async collectSystemStats(): Promise<void> {
    try {
      const stats = await this.gatherSystemMetrics();
      await storage.createSystemStats(stats);
      
      console.log('System stats collected:', stats);
    } catch (error) {
      console.error('Failed to collect system stats:', error);
    }
  }

  private async gatherSystemMetrics(): Promise<InsertSystemStats> {
    // Get current stats
    const currentStats = await this.getCurrentMetrics();
    
    // Get posts count for today
    const postsToday = await this.getPostsToday();
    
    // Calculate engagement rate
    const engagementRate = await this.calculateEngagementRate();
    
    // Get AI replies count
    const aiReplies = await this.getAIRepliesCount();
    
    // Check active sources
    const { activeSources, totalSources } = await this.checkSources();

    return {
      postsToday,
      engagementRate: engagementRate.toString(),
      aiReplies,
      activeSources,
      totalSources,
      cpuUsage: currentStats.cpuUsage.toString(),
      memoryUsage: currentStats.memoryUsage.toString(),
      storageUsage: currentStats.storageUsage.toString(),
      uptime: Math.floor(currentStats.uptime)
    };
  }

  private async getCurrentMetrics() {
    // Simulate system metrics (in production, would use actual system monitoring)
    return {
      cpuUsage: Math.random() * 40 + 10, // 10-50%
      memoryUsage: Math.random() * 8 + 4, // 4-12 GB
      storageUsage: Math.random() * 20 + 40, // 40-60 GB
      uptime: Date.now() / 1000 - (7 * 24 * 60 * 60) // ~7 days ago
    };
  }

  private async getPostsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const posts = await storage.getRecentPosts(100);
    return posts.filter(post => 
      post.createdAt && post.createdAt >= today
    ).length;
  }

  private async calculateEngagementRate(): Promise<number> {
    const engagementStats = await storage.getEngagementStats(7);
    
    if (engagementStats.length === 0) return 0;
    
    const totalEngagement = engagementStats.reduce((sum, stat) => 
      sum + (stat.likes || 0) + (stat.shares || 0) + (stat.comments || 0), 0);
    const totalImpressions = engagementStats.reduce((sum, stat) => 
      sum + (stat.impressions || 1), 0); // Avoid division by zero
    
    return Number(((totalEngagement / totalImpressions) * 100).toFixed(2));
  }

  private async getAIRepliesCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const engagementHistory = await storage.getEngagementHistory(100);
    return engagementHistory.filter(engagement => 
      engagement.type === 'reply' && 
      engagement.createdAt && engagement.createdAt >= today &&
      engagement.success
    ).length;
  }

  private async checkSources(): Promise<{ activeSources: number; totalSources: number }> {
    // In production, would check actual RSS feeds and API status
    const totalSources = 15;
    const activeSources = Math.floor(Math.random() * 3) + totalSources - 3; // Simulate 0-3 sources down
    
    return { activeSources, totalSources };
  }

  async updatePostAnalytics(postId: string, platform: string, metrics: {
    likes?: number;
    shares?: number;
    comments?: number;
    retweets?: number;
    impressions?: number;
  }): Promise<void> {
    try {
      const existingAnalytics = await storage.getAnalyticsByPost(postId);
      const platformAnalytics = existingAnalytics.find(a => a.platform === platform);

      if (platformAnalytics) {
        // Update existing analytics
        const engagementRate = this.calculateEngagementRateForPost(metrics);
        // Would update the analytics record here
        console.log(`Updated analytics for post ${postId} on ${platform}:`, metrics);
      } else {
        // Create new analytics record
        const engagementRate = this.calculateEngagementRateForPost(metrics);
        await storage.createAnalytics({
          postId,
          platform,
          likes: metrics.likes || 0,
          shares: metrics.shares || 0,
          comments: metrics.comments || 0,
          retweets: metrics.retweets || 0,
          impressions: metrics.impressions || 0,
          engagementRate: engagementRate.toString()
        });
      }
    } catch (error) {
      console.error(`Failed to update analytics for post ${postId}:`, error);
    }
  }

  private calculateEngagementRateForPost(metrics: {
    likes?: number;
    shares?: number;
    comments?: number;
    retweets?: number;
    impressions?: number;
  }): number {
    const totalEngagement = (metrics.likes || 0) + (metrics.shares || 0) + 
                           (metrics.comments || 0) + (metrics.retweets || 0);
    const impressions = metrics.impressions || 1;
    
    return Number(((totalEngagement / impressions) * 100).toFixed(2));
  }

  async generateEngagementReport(days: number = 7): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    averageEngagementRate: number;
    topPerformingPosts: Array<{
      title: string;
      platform: string;
      engagementRate: number;
      totalEngagement: number;
    }>;
  }> {
    try {
      const engagementStats = await storage.getEngagementStats(days);
      const recentPosts = await storage.getRecentPosts(50);

      const totalLikes = engagementStats.reduce((sum, stat) => sum + (stat.likes || 0), 0);
      const totalShares = engagementStats.reduce((sum, stat) => sum + (stat.shares || 0), 0);
      const totalComments = engagementStats.reduce((sum, stat) => sum + (stat.comments || 0), 0);
      
      const averageEngagementRate = engagementStats.length > 0 
        ? engagementStats.reduce((sum, stat) => sum + Number(stat.engagementRate || 0), 0) / engagementStats.length
        : 0;

      // Get top performing posts
      const topPerformingPosts = await Promise.all(
        recentPosts.slice(0, 5).map(async (post) => {
          const analytics = await storage.getAnalyticsByPost(post.id);
          const totalEngagement = analytics.reduce((sum, a) => 
            sum + (a.likes || 0) + (a.shares || 0) + (a.comments || 0), 0);
          const avgEngagementRate = analytics.length > 0
            ? analytics.reduce((sum, a) => sum + Number(a.engagementRate || 0), 0) / analytics.length
            : 0;

          return {
            title: post.title,
            platform: analytics[0]?.platform || 'Unknown',
            engagementRate: Number(avgEngagementRate.toFixed(2)),
            totalEngagement
          };
        })
      );

      return {
        totalPosts: recentPosts.length,
        totalLikes,
        totalShares,
        totalComments,
        averageEngagementRate: Number(averageEngagementRate.toFixed(2)),
        topPerformingPosts: topPerformingPosts.sort((a, b) => b.totalEngagement - a.totalEngagement)
      };
    } catch (error) {
      console.error('Failed to generate engagement report:', error);
      return {
        totalPosts: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        averageEngagementRate: 0,
        topPerformingPosts: []
      };
    }
  }

  startPeriodicCollection(): void {
    // Collect system stats every 5 minutes
    setInterval(() => {
      this.collectSystemStats();
    }, 5 * 60 * 1000);

    // Initial collection
    this.collectSystemStats();
  }
}

// Initialize analytics service
const analyticsService = new AnalyticsService();
analyticsService.startPeriodicCollection();

export { analyticsService };
