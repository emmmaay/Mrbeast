import { 
  users, posts, analytics, configurations, engagementLog, 
  contentQueue, targetAccounts, systemStats, activityFeed,
  socialCredentials, browserSessions,
  type User, type InsertUser, type Post, type InsertPost,
  type Analytics, type InsertAnalytics, type Configuration, type InsertConfiguration,
  type EngagementLog, type InsertEngagementLog, type ContentQueue, type InsertContentQueue,
  type TargetAccount, type InsertTargetAccount, type SystemStats, type InsertSystemStats,
  type ActivityFeed, type InsertActivityFeed, type SocialCredentials, type InsertSocialCredentials,
  type BrowserSession, type InsertBrowserSession
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: string): Promise<Post | undefined>;
  getRecentPosts(limit?: number): Promise<Post[]>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post>;
  findSimilarPosts(content: string, threshold: number): Promise<Post[]>;

  // Analytics
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByPost(postId: string): Promise<Analytics[]>;
  getEngagementStats(days: number): Promise<Analytics[]>;

  // Configurations
  getConfiguration(key: string): Promise<Configuration | undefined>;
  setConfiguration(config: InsertConfiguration): Promise<Configuration>;
  getAllConfigurations(): Promise<Configuration[]>;

  // Engagement Log
  logEngagement(engagement: InsertEngagementLog): Promise<EngagementLog>;
  getEngagementHistory(limit?: number): Promise<EngagementLog[]>;

  // Content Queue
  addToQueue(queueItem: InsertContentQueue): Promise<ContentQueue>;
  getQueuedContent(platform?: string): Promise<ContentQueue[]>;
  updateQueueStatus(id: string, status: string, error?: string): Promise<ContentQueue>;

  // Target Accounts
  createTargetAccount(account: InsertTargetAccount): Promise<TargetAccount>;
  getTargetAccounts(platform?: string, type?: string): Promise<TargetAccount[]>;
  updateTargetAccount(id: string, updates: Partial<TargetAccount>): Promise<TargetAccount>;

  // System Stats
  createSystemStats(stats: InsertSystemStats): Promise<SystemStats>;
  getLatestSystemStats(): Promise<SystemStats | undefined>;
  getSystemStatsHistory(days: number): Promise<SystemStats[]>;

  // Activity Feed
  addActivity(activity: InsertActivityFeed): Promise<ActivityFeed>;
  getRecentActivity(limit?: number): Promise<ActivityFeed[]>;

  // Social Credentials
  createSocialCredentials(credentials: InsertSocialCredentials): Promise<SocialCredentials>;
  getSocialCredentials(platform: string): Promise<SocialCredentials[]>;
  updateSocialCredentials(id: string, updates: Partial<SocialCredentials>): Promise<SocialCredentials>;
  deleteSocialCredentials(id: string): Promise<void>;

  // Browser Sessions
  createBrowserSession(session: InsertBrowserSession): Promise<BrowserSession>;
  getBrowserSession(platform: string): Promise<BrowserSession | undefined>;
  updateBrowserSession(id: string, updates: Partial<BrowserSession>): Promise<BrowserSession>;
  deleteBrowserSession(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Posts
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getRecentPosts(limit = 10): Promise<Post[]> {
    return await db.select().from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const [updatedPost] = await db.update(posts)
      .set(updates)
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async findSimilarPosts(content: string, threshold: number): Promise<Post[]> {
    // This would use a similarity function in production
    return await db.select().from(posts)
      .where(sql`similarity(${posts.content}, ${content}) > ${threshold}`);
  }

  // Analytics
  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db.insert(analytics).values(analyticsData).returning();
    return newAnalytics;
  }

  async getAnalyticsByPost(postId: string): Promise<Analytics[]> {
    return await db.select().from(analytics).where(eq(analytics.postId, postId));
  }

  async getEngagementStats(days: number): Promise<Analytics[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return await db.select().from(analytics)
      .where(gte(analytics.createdAt, daysAgo))
      .orderBy(desc(analytics.createdAt));
  }

  // Configurations
  async getConfiguration(key: string): Promise<Configuration | undefined> {
    const [config] = await db.select().from(configurations).where(eq(configurations.key, key));
    return config || undefined;
  }

  async setConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const [newConfig] = await db.insert(configurations)
      .values(config)
      .onConflictDoUpdate({
        target: configurations.key,
        set: { value: config.value, updatedAt: sql`now()` }
      })
      .returning();
    return newConfig;
  }

  async getAllConfigurations(): Promise<Configuration[]> {
    return await db.select().from(configurations);
  }

  // Engagement Log
  async logEngagement(engagement: InsertEngagementLog): Promise<EngagementLog> {
    const [log] = await db.insert(engagementLog).values(engagement).returning();
    return log;
  }

  async getEngagementHistory(limit = 50): Promise<EngagementLog[]> {
    return await db.select().from(engagementLog)
      .orderBy(desc(engagementLog.createdAt))
      .limit(limit);
  }

  // Content Queue
  async addToQueue(queueItem: InsertContentQueue): Promise<ContentQueue> {
    const [item] = await db.insert(contentQueue).values(queueItem).returning();
    return item;
  }

  async getQueuedContent(platform?: string): Promise<ContentQueue[]> {
    const query = db.select().from(contentQueue);
    if (platform) {
      return await query.where(eq(contentQueue.platform, platform))
        .orderBy(contentQueue.scheduledFor);
    }
    return await query.orderBy(contentQueue.scheduledFor);
  }

  async updateQueueStatus(id: string, status: string, error?: string): Promise<ContentQueue> {
    const [updated] = await db.update(contentQueue)
      .set({ status, error })
      .where(eq(contentQueue.id, id))
      .returning();
    return updated;
  }

  // Target Accounts
  async createTargetAccount(account: InsertTargetAccount): Promise<TargetAccount> {
    const [newAccount] = await db.insert(targetAccounts).values(account).returning();
    return newAccount;
  }

  async getTargetAccounts(platform?: string, type?: string): Promise<TargetAccount[]> {
    let baseQuery = db.select().from(targetAccounts);
    
    if (platform && type) {
      return await baseQuery.where(and(
        eq(targetAccounts.isActive, true),
        eq(targetAccounts.platform, platform),
        eq(targetAccounts.type, type)
      ));
    } else if (platform) {
      return await baseQuery.where(and(
        eq(targetAccounts.isActive, true),
        eq(targetAccounts.platform, platform)
      ));
    } else if (type) {
      return await baseQuery.where(and(
        eq(targetAccounts.isActive, true),
        eq(targetAccounts.type, type)
      ));
    }
    
    return await baseQuery.where(eq(targetAccounts.isActive, true));
  }

  async updateTargetAccount(id: string, updates: Partial<TargetAccount>): Promise<TargetAccount> {
    const [updated] = await db.update(targetAccounts)
      .set(updates)
      .where(eq(targetAccounts.id, id))
      .returning();
    return updated;
  }

  // System Stats
  async createSystemStats(stats: InsertSystemStats): Promise<SystemStats> {
    const [newStats] = await db.insert(systemStats).values(stats).returning();
    return newStats;
  }

  async getLatestSystemStats(): Promise<SystemStats | undefined> {
    const [stats] = await db.select().from(systemStats)
      .orderBy(desc(systemStats.date))
      .limit(1);
    return stats || undefined;
  }

  async getSystemStatsHistory(days: number): Promise<SystemStats[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return await db.select().from(systemStats)
      .where(gte(systemStats.date, daysAgo))
      .orderBy(desc(systemStats.date));
  }

  // Activity Feed
  async addActivity(activity: InsertActivityFeed): Promise<ActivityFeed> {
    const [newActivity] = await db.insert(activityFeed).values(activity).returning();
    return newActivity;
  }

  async getRecentActivity(limit = 20): Promise<ActivityFeed[]> {
    return await db.select().from(activityFeed)
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit);
  }

  // Social Credentials
  async createSocialCredentials(credentials: InsertSocialCredentials): Promise<SocialCredentials> {
    const [newCredentials] = await db.insert(socialCredentials).values(credentials).returning();
    return newCredentials;
  }

  async getSocialCredentials(platform: string): Promise<SocialCredentials[]> {
    return await db.select().from(socialCredentials)
      .where(and(
        eq(socialCredentials.platform, platform),
        eq(socialCredentials.isActive, true)
      ));
  }

  async updateSocialCredentials(id: string, updates: Partial<SocialCredentials>): Promise<SocialCredentials> {
    const [updated] = await db.update(socialCredentials)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(socialCredentials.id, id))
      .returning();
    return updated;
  }

  async deleteSocialCredentials(id: string): Promise<void> {
    await db.update(socialCredentials)
      .set({ isActive: false })
      .where(eq(socialCredentials.id, id));
  }

  // Browser Sessions
  async createBrowserSession(session: InsertBrowserSession): Promise<BrowserSession> {
    const [newSession] = await db.insert(browserSessions).values(session).returning();
    return newSession;
  }

  async getBrowserSession(platform: string): Promise<BrowserSession | undefined> {
    const [session] = await db.select().from(browserSessions)
      .where(and(
        eq(browserSessions.platform, platform),
        eq(browserSessions.isActive, true)
      ))
      .orderBy(desc(browserSessions.lastUsed))
      .limit(1);
    return session || undefined;
  }

  async updateBrowserSession(id: string, updates: Partial<BrowserSession>): Promise<BrowserSession> {
    const [updated] = await db.update(browserSessions)
      .set({ ...updates, lastUsed: sql`now()` })
      .where(eq(browserSessions.id, id))
      .returning();
    return updated;
  }

  async deleteBrowserSession(id: string): Promise<void> {
    await db.update(browserSessions)
      .set({ isActive: false })
      .where(eq(browserSessions.id, id));
  }
}

export const storage = new DatabaseStorage();
