import puppeteer, { Browser, Page } from 'puppeteer';
import { storage } from '../storage';
import type { SocialCredentials, Post } from '@shared/schema';

interface BrowserAutomationConfig {
  headless: boolean;
  userAgent: string;
  viewport: { width: number; height: number };
  timeout: number;
  delays: {
    typing: { min: number; max: number };
    actions: { min: number; max: number };
    navigation: { min: number; max: number };
  };
}

export class BrowserAutomation {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();
  private config: BrowserAutomationConfig;

  constructor() {
    this.config = {
      headless: process.env.NODE_ENV === 'production',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      timeout: 30000,
      delays: {
        typing: { min: 50, max: 150 },
        actions: { min: 1000, max: 3000 },
        navigation: { min: 2000, max: 5000 }
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--window-size=1920,1080'
        ],
        defaultViewport: this.config.viewport
      });

      console.log('Browser automation initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async loginToTwitter(credentials: SocialCredentials): Promise<boolean> {
    try {
      if (!this.browser) {
        await this.initialize();
      }

      const page = await this.browser!.newPage();
      await page.setUserAgent(this.config.userAgent);

      // Go to Twitter login page
      await page.goto('https://twitter.com/i/flow/login', { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      await this.humanDelay(this.config.delays.navigation);

      // Enter username
      const usernameSelector = 'input[autocomplete="username"]';
      await page.waitForSelector(usernameSelector);
      await this.typeHumanLike(page, usernameSelector, (credentials.credentials as any).username);

      // Click next
      await page.click('[role="button"][data-testid="LoginForm_Login_Button"]');
      await this.humanDelay(this.config.delays.actions);

      // Handle potential phone/email verification
      try {
        await page.waitForSelector('input[data-testid="ocfEnterTextTextInput"]', { timeout: 5000 });
        if ((credentials.credentials as any).email) {
          await this.typeHumanLike(page, 'input[data-testid="ocfEnterTextTextInput"]', (credentials.credentials as any).email);
          await page.click('[role="button"][data-testid="ocfEnterTextNextButton"]');
          await this.humanDelay(this.config.delays.actions);
        }
      } catch {
        // No additional verification needed
      }

      // Enter password
      const passwordSelector = 'input[name="password"]';
      await page.waitForSelector(passwordSelector);
      await this.typeHumanLike(page, passwordSelector, (credentials.credentials as any).password);

      // Click login
      await page.click('[role="button"][data-testid="LoginForm_Login_Button"]');
      await this.humanDelay(this.config.delays.navigation);

      // Verify login success
      await page.waitForSelector('[data-testid="SideNav_AccountSwitcher_Button"]', { timeout: 10000 });

      // Store session data
      const cookies = await page.cookies();
      const sessionData = {
        cookies,
        userAgent: this.config.userAgent,
        timestamp: new Date().toISOString()
      };

      await storage.createBrowserSession({
        platform: 'twitter',
        sessionData,
        userAgent: this.config.userAgent,
        isActive: true
      });

      // Update credentials with last login
      await storage.updateSocialCredentials(credentials.id, {
        lastLogin: new Date()
      });

      this.pages.set('twitter', page);

      await storage.addActivity({
        type: 'system',
        title: 'Twitter Login Successful',
        description: `Successfully logged into Twitter account: ${credentials.accountName}`,
        metadata: { 
          platform: 'twitter',
          accountName: credentials.accountName,
          accountType: credentials.accountType
        }
      });

      console.log(`Successfully logged into Twitter: ${credentials.accountName}`);
      return true;
    } catch (error) {
      console.error('Twitter login failed:', error);
      
      await storage.addActivity({
        type: 'system',
        title: 'Twitter Login Failed',
        description: `Failed to login to Twitter account: ${credentials.accountName}`,
        metadata: { 
          platform: 'twitter',
          accountName: credentials.accountName,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return false;
    }
  }

  async postToTwitter(content: string, post: Post): Promise<boolean> {
    try {
      const page = this.pages.get('twitter');
      if (!page) {
        throw new Error('Twitter session not available. Please login first.');
      }

      // Navigate to home/compose
      await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' });
      await this.humanDelay(this.config.delays.navigation);

      // Click compose tweet
      const composeButton = '[data-testid="SideNav_NewTweet_Button"]';
      await page.waitForSelector(composeButton);
      await page.click(composeButton);
      await this.humanDelay(this.config.delays.actions);

      // Get character limit
      const accountType = await this.getTwitterAccountType(page);
      const characterLimit = accountType === 'premium' ? 25000 : 280;

      // Handle threading if content is too long
      if (content.length > characterLimit) {
        return await this.postTwitterThread(page, content, characterLimit, post);
      } else {
        return await this.postSingleTweet(page, content, post);
      }
    } catch (error) {
      console.error('Failed to post to Twitter:', error);
      
      await storage.addActivity({
        type: 'system',
        title: 'Twitter Posting Failed',
        description: `Failed to post: ${post.title}`,
        metadata: { 
          platform: 'twitter',
          postId: post.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return false;
    }
  }

  private async postSingleTweet(page: Page, content: string, post: Post): Promise<boolean> {
    // Type tweet content
    const tweetInput = '[data-testid="tweetTextarea_0"]';
    await page.waitForSelector(tweetInput);
    await this.typeHumanLike(page, tweetInput, content);

    await this.humanDelay(this.config.delays.actions);

    // Click tweet button
    const tweetButton = '[data-testid="tweetButtonInline"]';
    await page.click(tweetButton);

    // Wait for tweet to be posted
    await this.humanDelay(this.config.delays.navigation);

    await storage.addActivity({
      type: 'post',
      title: 'Posted to Twitter',
      description: post.title,
      metadata: { 
        platform: 'twitter',
        postId: post.id,
        contentLength: content.length,
        type: 'single_tweet'
      }
    });

    console.log(`Successfully posted single tweet: ${post.title}`);
    return true;
  }

  private async postTwitterThread(page: Page, content: string, characterLimit: number, post: Post): Promise<boolean> {
    // Break content into thread parts
    const threadParts = this.breakIntoThreads(content, characterLimit);

    for (let i = 0; i < threadParts.length; i++) {
      const part = threadParts[i];
      const tweetContent = i < threadParts.length - 1 ? 
        `${part} (${i + 1}/${threadParts.length})` : 
        part;

      // Type tweet content
      const tweetInput = `[data-testid="tweetTextarea_${i}"]`;
      await page.waitForSelector(tweetInput);
      await this.typeHumanLike(page, tweetInput, tweetContent);

      await this.humanDelay(this.config.delays.actions);

      // Add another tweet to thread (except for last part)
      if (i < threadParts.length - 1) {
        const addTweetButton = '[data-testid="addButton"]';
        await page.click(addTweetButton);
        await this.humanDelay(this.config.delays.actions);
      }
    }

    // Post the thread
    const tweetAllButton = '[data-testid="tweetButton"]';
    await page.click(tweetAllButton);

    // Wait for thread to be posted
    await this.humanDelay(this.config.delays.navigation);

    await storage.addActivity({
      type: 'post',
      title: 'Posted Twitter Thread',
      description: `${post.title} (${threadParts.length} tweets)`,
      metadata: { 
        platform: 'twitter',
        postId: post.id,
        contentLength: content.length,
        threadCount: threadParts.length,
        type: 'thread'
      }
    });

    console.log(`Successfully posted Twitter thread: ${post.title} (${threadParts.length} parts)`);
    return true;
  }

  async performEngagementAction(action: 'like' | 'retweet' | 'comment', targetUsername: string, content?: string): Promise<boolean> {
    try {
      const page = this.pages.get('twitter');
      if (!page) {
        throw new Error('Twitter session not available');
      }

      // Navigate to user's profile
      await page.goto(`https://twitter.com/${targetUsername}`, { waitUntil: 'networkidle2' });
      await this.humanDelay(this.config.delays.navigation);

      // Find the first tech-related tweet
      const tweets = await page.$$('[data-testid="tweet"]');
      if (tweets.length === 0) {
        throw new Error('No tweets found on profile');
      }

      const firstTweet = tweets[0];

      switch (action) {
        case 'like':
          const likeButton = await firstTweet.$('[data-testid="like"]');
          if (likeButton) {
            await likeButton.click();
            await this.humanDelay(this.config.delays.actions);
          }
          break;

        case 'retweet':
          const retweetButton = await firstTweet.$('[data-testid="retweet"]');
          if (retweetButton) {
            await retweetButton.click();
            await this.humanDelay(this.config.delays.actions);
            
            // Click retweet confirmation
            const confirmRetweet = await page.$('[data-testid="retweetConfirm"]');
            if (confirmRetweet) {
              await confirmRetweet.click();
              await this.humanDelay(this.config.delays.actions);
            }
          }
          break;

        case 'comment':
          const replyButton = await firstTweet.$('[data-testid="reply"]');
          if (replyButton && content) {
            await replyButton.click();
            await this.humanDelay(this.config.delays.actions);

            const replyInput = '[data-testid="tweetTextarea_0"]';
            await page.waitForSelector(replyInput);
            await this.typeHumanLike(page, replyInput, content);

            const replySubmit = '[data-testid="tweetButtonInline"]';
            await page.click(replySubmit);
            await this.humanDelay(this.config.delays.actions);
          }
          break;
      }

      await storage.addActivity({
        type: 'engagement',
        title: `Auto-${action}`,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)}d ${targetUsername}'s tweet`,
        metadata: { 
          platform: 'twitter',
          action,
          targetAccount: targetUsername,
          content: content || null
        }
      });

      console.log(`Successfully performed ${action} on ${targetUsername}'s tweet`);
      return true;
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
      return false;
    }
  }

  private async getTwitterAccountType(page: Page): Promise<'free' | 'premium'> {
    try {
      // Check for premium indicators
      const premiumIndicators = [
        '[data-testid="UserCell"] [aria-label*="Verified"]',
        '[data-testid="badge"]'
      ];

      for (const selector of premiumIndicators) {
        const element = await page.$(selector);
        if (element) {
          return 'premium';
        }
      }

      return 'free';
    } catch {
      return 'free';
    }
  }

  private breakIntoThreads(content: string, maxLength: number): string[] {
    const words = content.split(' ');
    const threads: string[] = [];
    let currentThread = '';

    for (const word of words) {
      const testLength = currentThread.length + word.length + 1; // +1 for space
      
      if (testLength <= maxLength - 20) { // Leave room for thread numbering
        currentThread += (currentThread ? ' ' : '') + word;
      } else {
        if (currentThread) {
          threads.push(currentThread);
          currentThread = word;
        }
      }
    }

    if (currentThread) {
      threads.push(currentThread);
    }

    return threads;
  }

  private async typeHumanLike(page: Page, selector: string, text: string): Promise<void> {
    await page.focus(selector);
    
    for (const char of text) {
      await page.keyboard.type(char, { 
        delay: Math.random() * (this.config.delays.typing.max - this.config.delays.typing.min) + this.config.delays.typing.min 
      });
    }
  }

  private async humanDelay(delayConfig: { min: number; max: number }): Promise<void> {
    const delay = Math.random() * (delayConfig.max - delayConfig.min) + delayConfig.min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.pages.clear();
      console.log('Browser automation cleaned up');
    }
  }

  async restoreSession(platform: string): Promise<boolean> {
    try {
      const session = await storage.getBrowserSession(platform);
      if (!session || !session.sessionData) {
        return false;
      }

      if (!this.browser) {
        await this.initialize();
      }

      const page = await this.browser!.newPage();
      await page.setUserAgent(session.userAgent || this.config.userAgent);

      // Restore cookies
      const sessionData = session.sessionData as any;
      if (sessionData.cookies) {
        await page.setCookie(...sessionData.cookies);
      }

      // Navigate to platform and verify session
      await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' });
      
      // Check if still logged in
      try {
        await page.waitForSelector('[data-testid="SideNav_AccountSwitcher_Button"]', { timeout: 5000 });
        this.pages.set(platform, page);
        
        // Update session last used
        await storage.updateBrowserSession(session.id, {
          lastUsed: new Date()
        });

        console.log(`Successfully restored ${platform} session`);
        return true;
      } catch {
        console.log(`${platform} session expired, need to re-login`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to restore ${platform} session:`, error);
      return false;
    }
  }
}

// Initialize browser automation service
const browserAutomation = new BrowserAutomation();

// Auto-restore sessions on startup
setTimeout(async () => {
  try {
    await browserAutomation.restoreSession('twitter');
  } catch (error) {
    console.log('No existing sessions to restore');
  }
}, 5000);

export { browserAutomation };