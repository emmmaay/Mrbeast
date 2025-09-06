import { storage } from "../storage";
import { aiProcessor } from "./aiProcessor";
import type { Post, ContentQueue } from "@shared/schema";

export class PlatformAutomation {
  private isRunning = true;

  async start(): Promise<void> {
    console.log('Starting platform automation...');
    
    // Process content queue every 30 seconds
    setInterval(() => {
      if (this.isRunning) {
        this.processContentQueue();
      }
    }, 30 * 1000);

    // Engagement actions every 2 minutes
    setInterval(() => {
      if (this.isRunning) {
        this.performEngagementActions();
      }
    }, 2 * 60 * 1000);

    // Initial run
    this.processContentQueue();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Platform automation stopped');
  }

  async processContentQueue(): Promise<void> {
    try {
      const queuedContent = await storage.getQueuedContent();
      const now = new Date();

      for (const queueItem of queuedContent) {
        if (queueItem.status === 'scheduled' && queueItem.scheduledFor <= now) {
          await this.processQueueItem(queueItem);
        }
      }
    } catch (error) {
      console.error('Failed to process content queue:', error);
    }
  }

  private async processQueueItem(queueItem: ContentQueue): Promise<void> {
    try {
      await storage.updateQueueStatus(queueItem.id, 'processing');

      const post = await storage.getPost(queueItem.postId!);
      if (!post) {
        await storage.updateQueueStatus(queueItem.id, 'failed', 'Post not found');
        return;
      }

      // Process content with AI if not already processed
      let contentToPost = post.processedContent || post.content;
      if (!post.aiProcessed) {
        contentToPost = await aiProcessor.processContent(post);
      }

      // Post to platform
      const success = await this.postToPlatform(queueItem.platform, contentToPost, post);

      if (success) {
        await storage.updateQueueStatus(queueItem.id, 'posted');
        await storage.updatePost(post.id, { 
          status: 'posted', 
          postedAt: new Date() 
        });

        await storage.addActivity({
          type: 'post',
          title: `Posted to ${queueItem.platform}`,
          description: post.title,
          metadata: { 
            postId: post.id,
            platform: queueItem.platform,
            contentLength: contentToPost.length
          }
        });

        // Create analytics entry
        await storage.createAnalytics({
          postId: post.id,
          platform: queueItem.platform,
          likes: 0,
          shares: 0,
          comments: 0,
          retweets: 0,
          impressions: 0
        });
      } else {
        await storage.updateQueueStatus(queueItem.id, 'failed', 'Platform posting failed');
      }
    } catch (error) {
      console.error(`Failed to process queue item ${queueItem.id}:`, error);
      await storage.updateQueueStatus(
        queueItem.id, 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async postToPlatform(platform: string, content: string, post: Post): Promise<boolean> {
    try {
      switch (platform) {
        case 'twitter':
          return await this.postToTwitter(content, post);
        case 'telegram':
          return await this.postToTelegram(content, post);
        case 'facebook':
          return await this.postToFacebook(content, post);
        default:
          console.error(`Unsupported platform: ${platform}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to post to ${platform}:`, error);
      return false;
    }
  }

  private async postToTwitter(content: string, post: Post): Promise<boolean> {
    try {
      // Check if content needs threading
      const characterLimit = await this.getTwitterCharacterLimit();
      
      if (content.length > characterLimit) {
        const threads = await aiProcessor.breakIntoThreads(content, characterLimit);
        
        // Post thread
        for (let i = 0; i < threads.length; i++) {
          const threadContent = `${threads[i]} ${i < threads.length - 1 ? `(${i + 1}/${threads.length})` : ''}`;
          
          // Simulate Twitter posting (would use actual Twitter automation)
          await this.simulateDelay(2000, 5000); // Human-like delay
          console.log(`Twitter thread ${i + 1}/${threads.length}:`, threadContent);
        }

        await storage.addActivity({
          type: 'post',
          title: 'Auto-threaded Twitter post',
          description: `Posted ${threads.length} tweets for: ${post.title}`,
          metadata: { 
            postId: post.id,
            threadCount: threads.length,
            totalLength: content.length
          }
        });
      } else {
        // Single tweet
        await this.simulateDelay(2000, 5000);
        console.log('Twitter post:', content);
      }

      return true;
    } catch (error) {
      console.error('Twitter posting failed:', error);
      return false;
    }
  }

  private async postToTelegram(content: string, post: Post): Promise<boolean> {
    try {
      // Telegram allows longer messages, format accordingly
      const telegramContent = `${post.title}\n\n${content}\n\n🔗 ${post.originalUrl}`;
      
      await this.simulateDelay(1000, 3000);
      console.log('Telegram post:', telegramContent);
      
      return true;
    } catch (error) {
      console.error('Telegram posting failed:', error);
      return false;
    }
  }

  private async postToFacebook(content: string, post: Post): Promise<boolean> {
    try {
      // Facebook Page post format
      const facebookContent = `${post.title}\n\n${content}\n\nRead more: ${post.originalUrl}`;
      
      await this.simulateDelay(3000, 7000);
      console.log('Facebook post:', facebookContent);
      
      return true;
    } catch (error) {
      console.error('Facebook posting failed:', error);
      return false;
    }
  }

  private async getTwitterCharacterLimit(): Promise<number> {
    // Check if premium account (would get from configuration)
    const config = await storage.getConfiguration('twitter_account_type');
    return config?.value === 'premium' ? 25000 : 280;
  }

  async performEngagementActions(): Promise<void> {
    try {
      const config = await storage.getConfiguration('auto_engagement');
      if (!config?.value || !(config.value as any)?.enabled) {
        return;
      }

      // Get target accounts for different types of engagement
      const likeTargets = await storage.getTargetAccounts('twitter', 'like');
      const retweetTargets = await storage.getTargetAccounts('twitter', 'retweet');
      const commentTargets = await storage.getTargetAccounts('twitter', 'comment');

      // Perform likes (with human-like delays)
      for (const target of likeTargets.slice(0, 3)) { // Limit actions per cycle
        await this.performLike(target.username, target.platform);
        await this.simulateDelay(10000, 60000); // 10-60 seconds between actions
      }

      // Perform retweets
      for (const target of retweetTargets.slice(0, 2)) {
        await this.performRetweet(target.username, target.platform);
        await this.simulateDelay(30000, 120000); // 30-120 seconds
      }

      // Perform comments
      for (const target of commentTargets.slice(0, 1)) {
        await this.performComment(target.username, target.platform);
        await this.simulateDelay(300000, 900000); // 5-15 minutes
      }
    } catch (error) {
      console.error('Engagement actions failed:', error);
    }
  }

  private async performLike(username: string, platform: string): Promise<void> {
    try {
      // Simulate liking a recent tech-related post
      console.log(`Liking recent tech post from @${username} on ${platform}`);
      
      await storage.logEngagement({
        type: 'like',
        platform,
        targetAccount: username,
        success: true
      });

      await storage.addActivity({
        type: 'engagement',
        title: 'Auto-engagement',
        description: `Liked post from @${username}`,
        metadata: { 
          platform,
          action: 'like',
          targetAccount: username
        }
      });
    } catch (error) {
      console.error(`Failed to like post from ${username}:`, error);
      
      await storage.logEngagement({
        type: 'like',
        platform,
        targetAccount: username,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async performRetweet(username: string, platform: string): Promise<void> {
    try {
      console.log(`Retweeting recent tech post from @${username} on ${platform}`);
      
      await storage.logEngagement({
        type: 'retweet',
        platform,
        targetAccount: username,
        success: true
      });

      await storage.addActivity({
        type: 'engagement',
        title: 'Auto-engagement',
        description: `Retweeted post from @${username}`,
        metadata: { 
          platform,
          action: 'retweet',
          targetAccount: username
        }
      });
    } catch (error) {
      console.error(`Failed to retweet from ${username}:`, error);
      
      await storage.logEngagement({
        type: 'retweet',
        platform,
        targetAccount: username,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async performComment(username: string, platform: string): Promise<void> {
    try {
      // Generate AI comment for the latest tech post
      const comment = await aiProcessor.generateComment('Latest tech development post');
      
      console.log(`Commenting on post from @${username}: ${comment}`);
      
      await storage.logEngagement({
        type: 'comment',
        platform,
        targetAccount: username,
        content: comment,
        success: true
      });

      await storage.addActivity({
        type: 'engagement',
        title: 'Auto-engagement',
        description: `Commented on @${username}'s post`,
        metadata: { 
          platform,
          action: 'comment',
          targetAccount: username,
          comment: comment.substring(0, 50) + '...'
        }
      });
    } catch (error) {
      console.error(`Failed to comment on ${username}'s post:`, error);
      
      await storage.logEngagement({
        type: 'comment',
        platform,
        targetAccount: username,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async schedulePost(post: Post, delayMinutes: number = 0): Promise<void> {
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes);

    const platforms = post.platforms as string[];
    
    for (const platform of platforms) {
      await storage.addToQueue({
        postId: post.id,
        platform,
        scheduledFor,
        status: 'scheduled'
      });
    }

    console.log(`Scheduled post "${post.title}" for ${platforms.join(', ')} at ${scheduledFor}`);
  }
}

// Initialize platform automation
const platformAutomation = new PlatformAutomation();
platformAutomation.start();

export { platformAutomation };
