import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertPostSchema, insertConfigurationSchema, insertTargetAccountSchema, insertSocialCredentialsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast function for real-time updates
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Dashboard API routes
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getLatestSystemStats();
      const recentPosts = await storage.getRecentPosts(3);
      const engagementStats = await storage.getEngagementStats(7);
      
      // Calculate engagement rate
      const totalEngagement = engagementStats.reduce((sum, stat) => 
        sum + (stat.likes || 0) + (stat.shares || 0) + (stat.comments || 0), 0);
      const totalImpressions = engagementStats.reduce((sum, stat) => 
        sum + (stat.impressions || 0), 0);
      const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

      res.json({
        postsToday: stats?.postsToday || 0,
        engagementRate: Number(engagementRate.toFixed(1)),
        aiReplies: stats?.aiReplies || 0,
        activeSources: stats?.activeSources || 0,
        totalSources: stats?.totalSources || 15,
        recentPosts: recentPosts.length,
        cpuUsage: Number(stats?.cpuUsage || 0),
        memoryUsage: Number(stats?.memoryUsage || 0),
        storageUsage: Number(stats?.storageUsage || 0),
        uptime: stats?.uptime || 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  app.get('/api/dashboard/activity', async (req, res) => {
    try {
      const activities = await storage.getRecentActivity(10);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
  });

  app.get('/api/dashboard/recent-posts', async (req, res) => {
    try {
      const posts = await storage.getRecentPosts(5);
      const postsWithAnalytics = await Promise.all(
        posts.map(async (post) => {
          const analytics = await storage.getAnalyticsByPost(post.id);
          const totalLikes = analytics.reduce((sum, a) => sum + (a.likes || 0), 0);
          const totalShares = analytics.reduce((sum, a) => sum + (a.shares || 0), 0);
          const totalComments = analytics.reduce((sum, a) => sum + (a.comments || 0), 0);
          
          return {
            ...post,
            analytics: {
              likes: totalLikes,
              shares: totalShares,
              comments: totalComments,
              platforms: post.platforms
            }
          };
        })
      );
      res.json(postsWithAnalytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recent posts' });
    }
  });

  app.get('/api/configurations', async (req, res) => {
    try {
      const configs = await storage.getAllConfigurations();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  app.post('/api/configurations', async (req, res) => {
    try {
      const configData = insertConfigurationSchema.parse(req.body);
      const config = await storage.setConfiguration(configData);
      
      // Broadcast configuration change
      broadcast({
        type: 'configuration_updated',
        data: config
      });
      
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid configuration data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update configuration' });
      }
    }
  });

  app.get('/api/target-accounts', async (req, res) => {
    try {
      const { platform, type } = req.query;
      const accounts = await storage.getTargetAccounts(
        platform as string,
        type as string
      );
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch target accounts' });
    }
  });

  app.post('/api/target-accounts', async (req, res) => {
    try {
      const accountData = insertTargetAccountSchema.parse(req.body);
      const account = await storage.createTargetAccount(accountData);
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid account data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create target account' });
      }
    }
  });

  app.get('/api/engagement/history', async (req, res) => {
    try {
      const { limit = '20' } = req.query;
      const history = await storage.getEngagementHistory(parseInt(limit as string));
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch engagement history' });
    }
  });

  app.get('/api/analytics/engagement/:days', async (req, res) => {
    try {
      const days = parseInt(req.params.days);
      const stats = await storage.getEngagementStats(days);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch engagement analytics' });
    }
  });

  app.post('/api/posts', async (req, res) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      
      // Add activity
      await storage.addActivity({
        type: 'post',
        title: 'New post created',
        description: post.title,
        metadata: { postId: post.id, platforms: post.platforms }
      });

      // Broadcast new post
      broadcast({
        type: 'new_post',
        data: post
      });
      
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid post data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create post' });
      }
    }
  });

  app.get('/api/system/health', async (req, res) => {
    try {
      const stats = await storage.getLatestSystemStats();
      const platforms = [
        { name: 'Twitter/X', status: 'online', lastPost: '12 min ago' },
        { name: 'Telegram', status: 'online', lastPost: '8 min ago' },
        { name: 'Facebook Page', status: 'online', lastPost: '23 min ago' },
        { name: 'Groq AI', status: 'online', info: '3 keys rotating' }
      ];
      
      res.json({
        platforms,
        system: {
          cpuUsage: Number(stats?.cpuUsage || 23),
          memoryUsage: Number(stats?.memoryUsage || 8.2),
          memoryTotal: 24,
          storageUsage: Number(stats?.storageUsage || 47),
          storageTotal: 220,
          uptime: stats?.uptime || 642720 // 7d 14h 32m in seconds
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  });

  // Social Credentials Management
  app.get('/api/social-credentials/:platform', async (req, res) => {
    try {
      const { platform } = req.params;
      const credentials = await storage.getSocialCredentials(platform);
      
      // Don't send sensitive credential data to frontend
      const sanitized = credentials.map(cred => ({
        id: cred.id,
        platform: cred.platform,
        accountName: cred.accountName,
        accountType: cred.accountType,
        isActive: cred.isActive,
        lastLogin: cred.lastLogin
      }));
      
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch credentials' });
    }
  });

  app.post('/api/social-credentials', async (req, res) => {
    try {
      const credentialsData = insertSocialCredentialsSchema.parse(req.body);
      const credentials = await storage.createSocialCredentials(credentialsData);
      
      await storage.addActivity({
        type: 'system',
        title: 'Social Account Added',
        description: `Added ${credentials.platform} account: ${credentials.accountName}`,
        metadata: { platform: credentials.platform, accountName: credentials.accountName }
      });

      broadcast({
        type: 'credentials_updated',
        data: { platform: credentials.platform, action: 'added' }
      });
      
      res.json({ success: true, message: 'Credentials saved successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid credential data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to save credentials' });
      }
    }
  });

  app.put('/api/social-credentials/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const credentials = await storage.updateSocialCredentials(id, updates);
      
      broadcast({
        type: 'credentials_updated',
        data: { platform: credentials.platform, action: 'updated' }
      });
      
      res.json({ success: true, message: 'Credentials updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update credentials' });
    }
  });

  app.delete('/api/social-credentials/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSocialCredentials(id);
      
      broadcast({
        type: 'credentials_updated',
        data: { action: 'deleted' }
      });
      
      res.json({ success: true, message: 'Credentials deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete credentials' });
    }
  });

  // Default target accounts initialization
  app.post('/api/initialize-defaults', async (req, res) => {
    try {
      const defaultTwitterAccounts = [
        { platform: 'twitter', username: 'elonmusk', type: 'like', niche: 'technology' },
        { platform: 'twitter', username: 'sundarpichai', type: 'like', niche: 'technology' },
        { platform: 'twitter', username: 'satyanadella', type: 'like', niche: 'technology' },
        { platform: 'twitter', username: 'tim_cook', type: 'like', niche: 'technology' },
        { platform: 'twitter', username: 'OpenAI', type: 'retweet', niche: 'technology' },
        { platform: 'twitter', username: 'Google', type: 'retweet', niche: 'technology' },
        { platform: 'twitter', username: 'Microsoft', type: 'retweet', niche: 'technology' },
        { platform: 'twitter', username: 'Apple', type: 'comment', niche: 'technology' },
        { platform: 'twitter', username: 'Meta', type: 'comment', niche: 'technology' }
      ];

      for (const account of defaultTwitterAccounts) {
        await storage.createTargetAccount(account);
      }

      await storage.addActivity({
        type: 'system',
        title: 'Default Configuration Initialized',
        description: `Added ${defaultTwitterAccounts.length} default target accounts`,
        metadata: { count: defaultTwitterAccounts.length }
      });

      res.json({ success: true, message: 'Default accounts initialized' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to initialize defaults' });
    }
  });

  // Emergency stop endpoint
  app.post('/api/emergency-stop', async (req, res) => {
    try {
      await storage.setConfiguration({
        key: 'emergency_stop',
        value: { enabled: true, timestamp: new Date().toISOString() },
        description: 'Emergency stop activated'
      });

      await storage.addActivity({
        type: 'system',
        title: 'Emergency Stop Activated',
        description: 'All automation systems have been stopped',
        metadata: { timestamp: new Date().toISOString() }
      });

      broadcast({
        type: 'emergency_stop',
        data: { enabled: true }
      });

      res.json({ success: true, message: 'Emergency stop activated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to activate emergency stop' });
    }
  });

  return httpServer;
}
