import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  originalUrl: text("original_url"),
  source: text("source").notNull(),
  platforms: jsonb("platforms").notNull().default('[]'), // ["twitter", "telegram", "facebook"]
  status: text("status").notNull().default("pending"), // pending, posted, failed
  aiProcessed: boolean("ai_processed").default(false),
  processedContent: text("processed_content"),
  threadData: jsonb("thread_data"), // for multi-part posts
  hashtags: jsonb("hashtags").default('[]'),
  niche: text("niche").notNull().default("technology"),
  similarity: decimal("similarity", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  postedAt: timestamp("posted_at"),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id),
  platform: text("platform").notNull(),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  retweets: integer("retweets").default(0),
  impressions: integer("impressions").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const configurations = pgTable("configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const engagementLog = pgTable("engagement_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // like, retweet, comment, reply
  platform: text("platform").notNull(),
  targetAccount: text("target_account"),
  targetPostId: text("target_post_id"),
  content: text("content"), // for comments/replies
  success: boolean("success").default(true),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentQueue = pgTable("content_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id),
  platform: text("platform").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, processing, posted, failed
  retryCount: integer("retry_count").default(0),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const targetAccounts = pgTable("target_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(),
  username: text("username").notNull(),
  type: text("type").notNull(), // like, retweet, comment
  niche: text("niche").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemStats = pgTable("system_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().defaultNow(),
  postsToday: integer("posts_today").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  aiReplies: integer("ai_replies").default(0),
  activeSources: integer("active_sources").default(0),
  totalSources: integer("total_sources").default(0),
  cpuUsage: decimal("cpu_usage", { precision: 5, scale: 2 }),
  memoryUsage: decimal("memory_usage", { precision: 10, scale: 2 }),
  storageUsage: decimal("storage_usage", { precision: 10, scale: 2 }),
  uptime: integer("uptime"), // in seconds
});

export const activityFeed = pgTable("activity_feed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // post, reply, engagement, filter, rss_update
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialCredentials = pgTable("social_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(), // twitter, telegram, facebook
  accountName: text("account_name").notNull(),
  credentials: jsonb("credentials").notNull(), // encrypted login data
  accountType: text("account_type").default("free"), // free, premium
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const browserSessions = pgTable("browser_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(),
  sessionData: jsonb("session_data").notNull(), // cookies, tokens, etc
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const postsRelations = relations(posts, ({ many }) => ({
  analytics: many(analytics),
  queueItems: many(contentQueue),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  post: one(posts, { fields: [analytics.postId], references: [posts.id] }),
}));

export const contentQueueRelations = relations(contentQueue, ({ one }) => ({
  post: one(posts, { fields: [contentQueue.postId], references: [posts.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({
  id: true,
  updatedAt: true,
});

export const insertEngagementLogSchema = createInsertSchema(engagementLog).omit({
  id: true,
  createdAt: true,
});

export const insertContentQueueSchema = createInsertSchema(contentQueue).omit({
  id: true,
  createdAt: true,
});

export const insertTargetAccountSchema = createInsertSchema(targetAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertSystemStatsSchema = createInsertSchema(systemStats).omit({
  id: true,
  date: true,
});

export const insertActivityFeedSchema = createInsertSchema(activityFeed).omit({
  id: true,
  createdAt: true,
});

export const insertSocialCredentialsSchema = createInsertSchema(socialCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrowserSessionSchema = createInsertSchema(browserSessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type EngagementLog = typeof engagementLog.$inferSelect;
export type InsertEngagementLog = z.infer<typeof insertEngagementLogSchema>;
export type ContentQueue = typeof contentQueue.$inferSelect;
export type InsertContentQueue = z.infer<typeof insertContentQueueSchema>;
export type TargetAccount = typeof targetAccounts.$inferSelect;
export type InsertTargetAccount = z.infer<typeof insertTargetAccountSchema>;
export type SystemStats = typeof systemStats.$inferSelect;
export type InsertSystemStats = z.infer<typeof insertSystemStatsSchema>;
export type ActivityFeed = typeof activityFeed.$inferSelect;
export type InsertActivityFeed = z.infer<typeof insertActivityFeedSchema>;
export type SocialCredentials = typeof socialCredentials.$inferSelect;
export type InsertSocialCredentials = z.infer<typeof insertSocialCredentialsSchema>;
export type BrowserSession = typeof browserSessions.$inferSelect;
export type InsertBrowserSession = z.infer<typeof insertBrowserSessionSchema>;
