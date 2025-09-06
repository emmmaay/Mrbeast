import { storage } from "../storage";
import type { Post } from "@shared/schema";

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIProcessor {
  private groqKeys = [
    process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY || '',
    process.env.GROQ_API_KEY_2 || '',
    process.env.GROQ_API_KEY_3 || ''
  ].filter(key => key.length > 0);

  private currentKeyIndex = 0;

  private getCurrentKey(): string {
    if (this.groqKeys.length === 0) {
      throw new Error('No Groq API keys available');
    }
    return this.groqKeys[this.currentKeyIndex];
  }

  private rotateKey(): void {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.groqKeys.length;
  }

  async processContent(post: Post): Promise<string> {
    try {
      const processedContent = await this.rephraseContent(post.content, post.title);
      
      // Update post with processed content
      await storage.updatePost(post.id, {
        processedContent,
        aiProcessed: true
      });

      await storage.addActivity({
        type: 'ai_processing',
        title: 'Content AI Processed',
        description: `Rephrased: "${post.title}"`,
        metadata: { 
          postId: post.id,
          originalLength: post.content.length,
          processedLength: processedContent.length
        }
      });

      return processedContent;
    } catch (error) {
      console.error('AI processing failed:', error);
      
      await storage.addActivity({
        type: 'ai_processing',
        title: 'AI Processing Failed',
        description: `Failed to process: "${post.title}"`,
        metadata: { 
          postId: post.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // Fallback to original content if AI fails
      return post.content;
    }
  }

  async rephraseContent(content: string, title: string): Promise<string> {
    const prompt = `Rewrite this tech news content in a natural, engaging way for social media. Remove any source attribution or "according to" phrases. Make it sound original and interesting:

Title: ${title}
Content: ${content}

Requirements:
- Remove source mentions completely
- Make it engaging for social media
- Keep key technical details
- Use active voice
- Make it sound like original reporting
- Keep it under 250 words`;

    return await this.callGroqAPI(prompt);
  }

  async generateReply(originalPost: string, commentContext: string): Promise<string> {
    const prompt = `Generate a natural, helpful reply to this comment on a tech post. Be knowledgeable but conversational:

Original Post: ${originalPost}
Comment to reply to: ${commentContext}

Requirements:
- Be helpful and informative
- Sound natural, not robotic
- Show expertise without being condescending
- Keep under 280 characters for Twitter
- Don't mention being AI or automated`;

    return await this.callGroqAPI(prompt);
  }

  async generateComment(postContent: string): Promise<string> {
    const prompt = `Generate a thoughtful comment for this tech post. Show genuine interest and add value:

Post: ${postContent}

Requirements:
- Be genuinely interested and engaged
- Add meaningful insight or ask thoughtful questions
- Sound human and natural
- Keep under 280 characters
- Don't mention being AI or automated`;

    return await this.callGroqAPI(prompt);
  }

  async breakIntoThreads(content: string, characterLimit: number = 280): Promise<string[]> {
    if (content.length <= characterLimit) {
      return [content];
    }

    const prompt = `Break this content into a Twitter thread. Each part should be under ${characterLimit} characters and flow naturally:

Content: ${content}

Requirements:
- Each tweet under ${characterLimit} characters
- Maintain narrative flow
- End each part naturally
- Don't use "thread" or "1/" numbering
- Make each part engaging on its own`;

    const response = await this.callGroqAPI(prompt);
    
    // Split the response into individual tweets
    return response
      .split('\n\n')
      .filter(tweet => tweet.trim().length > 0)
      .map(tweet => tweet.trim());
  }

  private async callGroqAPI(prompt: string, retries = 3): Promise<string> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getCurrentKey()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'mixtral-8x7b-32768',
            messages: [
              {
                role: 'system',
                content: 'You are a tech-savvy social media expert. Create engaging, natural content that sounds human and authentic.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          if (response.status === 429 || response.status === 503) {
            // Rate limit or service unavailable, try next key
            this.rotateKey();
            continue;
          }
          throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        }

        const data: GroqResponse = await response.json();
        
        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message.content.trim();
        }
        
        throw new Error('Invalid response from Groq API');
      } catch (error) {
        console.error(`Groq API attempt ${attempt + 1} failed:`, error);
        
        if (attempt < retries - 1) {
          this.rotateKey();
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        }
      }
    }

    throw new Error('All Groq API attempts failed');
  }

  async processAutomaticReplies(): Promise<void> {
    try {
      // This would integrate with platform-specific APIs to find comments needing replies
      console.log('Processing automatic replies...');
      
      // Get recent engagement log to find comments to reply to
      const recentEngagement = await storage.getEngagementHistory(10);
      
      for (const engagement of recentEngagement) {
        if (engagement.type === 'comment' && !engagement.content) {
          // Generate and send reply
          const reply = await this.generateReply(
            'Tech news post content', // Would get actual post content
            engagement.targetPostId || 'Comment content'
          );
          
          await storage.logEngagement({
            type: 'reply',
            platform: engagement.platform,
            targetAccount: engagement.targetAccount,
            targetPostId: engagement.targetPostId,
            content: reply,
            success: true
          });

          await storage.addActivity({
            type: 'reply',
            title: 'AI Reply Generated',
            description: `Replied to ${engagement.targetAccount} with contextual insight`,
            metadata: { 
              platform: engagement.platform,
              replyContent: reply.substring(0, 100) + '...'
            }
          });
        }
      }
    } catch (error) {
      console.error('Automatic reply processing failed:', error);
    }
  }
}

// Initialize AI processor
const aiProcessor = new AIProcessor();

// Process automatic replies every 5 minutes
setInterval(() => {
  aiProcessor.processAutomaticReplies();
}, 5 * 60 * 1000);

export { aiProcessor };
