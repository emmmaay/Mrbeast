import { storage } from "../storage";
import type { InsertPost } from "@shared/schema";

interface RSSItem {
  title: string;
  content: string;
  link: string;
  publishedAt: Date;
  source: string;
}

interface NewsAPIResponse {
  articles: Array<{
    title: string;
    description: string;
    url: string;
    publishedAt: string;
    source: { name: string };
  }>;
}

export class ContentAggregator {
  private rssSources = [
    'https://feeds.feedburner.com/oreilly/radar',
    'https://techcrunch.com/feed/',
    'https://arstechnica.com/rss/',
    'https://www.theverge.com/rss/index.xml',
    'https://feeds.macrumors.com/MacRumors-All'
  ];

  async fetchRSSFeeds(): Promise<RSSItem[]> {
    const items: RSSItem[] = [];
    
    for (const rssUrl of this.rssSources) {
      try {
        const response = await fetch(rssUrl);
        const xml = await response.text();
        
        // Parse RSS XML (simplified - would use proper XML parser)
        const feedItems = this.parseRSSXML(xml, rssUrl);
        items.push(...feedItems);
      } catch (error) {
        console.error(`Failed to fetch RSS from ${rssUrl}:`, error);
        
        await storage.addActivity({
          type: 'rss_update',
          title: 'RSS Feed Error',
          description: `Failed to fetch from ${rssUrl}`,
          metadata: { source: rssUrl, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    return items;
  }

  async fetchNewsAPI(): Promise<RSSItem[]> {
    const apiKey = process.env.NEWS_API_KEY || process.env.NEWSAPI_KEY || '';
    if (!apiKey) {
      console.warn('News API key not found, skipping NewsAPI fetch');
      return [];
    }

    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=technology OR AI OR software OR programming&sortBy=publishedAt&language=en&pageSize=20&apiKey=${apiKey}`
      );
      
      const data: NewsAPIResponse = await response.json();
      
      return data.articles.map(article => ({
        title: article.title,
        content: article.description || '',
        link: article.url,
        publishedAt: new Date(article.publishedAt),
        source: article.source.name
      }));
    } catch (error) {
      console.error('Failed to fetch from NewsAPI:', error);
      return [];
    }
  }

  async fetchHackerNews(): Promise<RSSItem[]> {
    try {
      const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const storyIds = await response.json();
      
      const stories: RSSItem[] = [];
      
      // Fetch top 10 stories
      for (let i = 0; i < Math.min(10, storyIds.length); i++) {
        const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyIds[i]}.json`);
        const story = await storyResponse.json();
        
        if (story.title && story.url) {
          stories.push({
            title: story.title,
            content: story.text || story.title,
            link: story.url,
            publishedAt: new Date(story.time * 1000),
            source: 'Hacker News'
          });
        }
      }
      
      return stories;
    } catch (error) {
      console.error('Failed to fetch from Hacker News:', error);
      return [];
    }
  }

  async aggregateContent(): Promise<void> {
    console.log('Starting content aggregation...');
    
    try {
      // Fetch from all sources
      const [rssItems, newsApiItems, hackerNewsItems] = await Promise.all([
        this.fetchRSSFeeds(),
        this.fetchNewsAPI(),
        this.fetchHackerNews()
      ]);

      const allItems = [...rssItems, ...newsApiItems, ...hackerNewsItems];
      console.log(`Fetched ${allItems.length} items from all sources`);

      // Filter and deduplicate content
      const filteredItems = await this.filterAndDeduplicate(allItems);
      console.log(`${filteredItems.length} items after filtering`);

      // Save new posts
      for (const item of filteredItems) {
        const postData: InsertPost = {
          title: item.title,
          content: item.content,
          originalUrl: item.link,
          source: item.source,
          platforms: ['twitter', 'telegram', 'facebook'],
          status: 'pending',
          niche: 'technology' // This would be determined by keyword matching
        };

        const post = await storage.createPost(postData);
        
        await storage.addActivity({
          type: 'post',
          title: 'New content aggregated',
          description: item.title,
          metadata: { 
            postId: post.id, 
            source: item.source,
            url: item.link 
          }
        });
      }

      // Update activity feed
      await storage.addActivity({
        type: 'rss_update',
        title: 'Content Aggregation Complete',
        description: `Fetched ${allItems.length} items, ${filteredItems.length} new posts created`,
        metadata: { 
          totalFetched: allItems.length,
          newPosts: filteredItems.length,
          sources: this.rssSources.length + 2 // RSS + NewsAPI + HackerNews
        }
      });

    } catch (error) {
      console.error('Content aggregation failed:', error);
      
      await storage.addActivity({
        type: 'rss_update',
        title: 'Content Aggregation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  private async filterAndDeduplicate(items: RSSItem[]): Promise<RSSItem[]> {
    const filtered: RSSItem[] = [];
    
    for (const item of items) {
      // Skip items without proper title or content
      if (!item.title || item.title.length < 10) continue;
      
      // Check for duplicates using title similarity
      const existingPosts = await storage.getRecentPosts(100);
      const isDuplicate = existingPosts.some(post => 
        this.calculateSimilarity(post.title, item.title) > 0.8
      );
      
      if (!isDuplicate) {
        filtered.push(item);
      }
    }
    
    return filtered;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation (would use more sophisticated algorithm in production)
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private parseRSSXML(xml: string, source: string): RSSItem[] {
    // Simplified RSS parsing - would use proper XML parser in production
    const items: RSSItem[] = [];
    
    try {
      // Extract items using regex (not recommended for production)
      const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
      
      for (const itemXml of itemMatches.slice(0, 10)) { // Limit to 10 items per source
        const title = this.extractXMLValue(itemXml, 'title');
        const description = this.extractXMLValue(itemXml, 'description');
        const link = this.extractXMLValue(itemXml, 'link');
        const pubDate = this.extractXMLValue(itemXml, 'pubDate');
        
        if (title && link) {
          items.push({
            title: this.cleanText(title),
            content: this.cleanText(description || title),
            link,
            publishedAt: pubDate ? new Date(pubDate) : new Date(),
            source: this.getSourceName(source)
          });
        }
      }
    } catch (error) {
      console.error(`Failed to parse RSS XML from ${source}:`, error);
    }
    
    return items;
  }

  private extractXMLValue(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? match[1].trim() : '';
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private getSourceName(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'RSS Feed';
    }
  }
}

// Initialize and run content aggregation every 15 minutes
const contentAggregator = new ContentAggregator();

// Start aggregation process
setInterval(() => {
  contentAggregator.aggregateContent();
}, 15 * 60 * 1000); // 15 minutes

// Initial run
contentAggregator.aggregateContent();

export { contentAggregator };
