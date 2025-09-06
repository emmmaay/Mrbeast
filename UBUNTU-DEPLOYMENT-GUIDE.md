# 🚀 Complete Ubuntu Deployment Guide
## Tech News Automation Bot - Your Social Media Empire

**This is your COMPLETE deployment package that will get your automation system running on Ubuntu AWS EC2.**

---

## 📋 What You're Getting

### ✅ **Complete Automation System**
- **Multi-Platform Posting**: Twitter/X, Telegram, Facebook Page
- **AI-Powered Content**: Groq API integration with 3-key rotation
- **Browser Automation**: Human-like Twitter interactions (no API limits!)
- **Smart Threading**: Auto-break long posts into engaging threads
- **Intelligent Engagement**: Auto-like, retweet, comment with AI responses
- **Real-time Dashboard**: Live monitoring and controls
- **Advanced Deduplication**: Never post duplicate content
- **Niche Flexibility**: Switch from tech to crypto/sports/finance instantly

### ✅ **Credential Management System**
- **Secure Login Storage**: Encrypted social media credentials
- **Session Persistence**: Stay logged in across restarts
- **Account Type Detection**: Free vs Premium Twitter accounts
- **Multi-Account Support**: Manage multiple accounts per platform

---

## 🔧 Step 1: Prepare Your Ubuntu Server

### Get Your API Keys FIRST:
1. **Groq API Keys** (3 keys for rotation): https://console.groq.com/
2. **News API Key**: https://newsapi.org/
3. **Telegram Bot Token**: https://t.me/BotFather
4. **Facebook Page Token**: https://developers.facebook.com/

### Copy Files to Ubuntu:
```bash
# 1. Copy all files to your Ubuntu server
scp -r ./* your-server-user@your-server-ip:/home/your-user/tech-news-bot/

# 2. SSH into your server
ssh your-server-user@your-server-ip

# 3. Move to project directory
cd /home/your-user/tech-news-bot
```

---

## 🚀 Step 2: Run the Automated Installation

```bash
# Make deployment script executable
chmod +x deploy-ubuntu.sh

# Run the complete installation
sudo ./deploy-ubuntu.sh
```

**This script will automatically:**
- Install Node.js 20, PostgreSQL, Chrome browser
- Create automation user and directories
- Set up systemd services
- Configure firewall rules
- Install all dependencies
- Set up logging and monitoring

---

## 🔑 Step 3: Configure Your API Keys

Edit the environment file with your real API keys:
```bash
sudo nano /opt/tech-news-bot/.env
```

**Replace ALL placeholder values:**
```env
# Database Configuration
DATABASE_URL=postgresql://tech_news_user:your_secure_password_here@localhost:5432/tech_news_db

# AI Configuration (GET FROM GROQ CONSOLE)
GROQ_API_KEY_1=gsk_your_actual_groq_key_1_here
GROQ_API_KEY_2=gsk_your_actual_groq_key_2_here  
GROQ_API_KEY_3=gsk_your_actual_groq_key_3_here

# News API (GET FROM NEWSAPI.ORG)
NEWS_API_KEY=your_actual_news_api_key_here

# Social Media API Keys (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
FACEBOOK_PAGE_TOKEN=your_facebook_page_token

# Application Configuration
NODE_ENV=production
PORT=5000
```

---

## 📁 Step 4: Copy Your Application Code

```bash
# Copy all your application files to the deployment directory
sudo cp -r server/ /opt/tech-news-bot/
sudo cp -r client/ /opt/tech-news-bot/
sudo cp -r shared/ /opt/tech-news-bot/
sudo cp package.json /opt/tech-news-bot/
sudo cp drizzle.config.ts /opt/tech-news-bot/
sudo cp tsconfig.json /opt/tech-news-bot/

# Set proper ownership
sudo chown -R automation:automation /opt/tech-news-bot/

# Install dependencies
sudo -u automation bash -c "cd /opt/tech-news-bot && npm install"
```

---

## 🗄️ Step 5: Initialize the Database

```bash
# Push database schema
sudo -u automation bash -c "cd /opt/tech-news-bot && npm run db:push"

# Start the application
sudo systemctl start tech-news-bot.service

# Check if everything is running
sudo systemctl status tech-news-bot.service
```

---

## 🌐 Step 6: Access Your Dashboard

Open your browser and go to:
```
http://your-server-ip:5000
```

**You should see:**
- Dark-themed dashboard with sidebar navigation
- Real-time stats and platform status
- Live activity feed
- Social account management panel

---

## 🔐 Step 7: Add Your Social Media Accounts

### In the Dashboard:
1. Click **"Add Account"** button
2. Select platform (Twitter/X, Telegram, Facebook)
3. Enter your login credentials:
   - **Username/Email**
   - **Password** 
   - **Account Type** (Free/Premium for Twitter)
4. Click **"Save Account"**

### The system will:
- Securely encrypt and store your credentials
- Automatically login using browser automation
- Maintain persistent sessions
- Detect account type for proper character limits

---

## ⚙️ Step 8: Configure Automation Settings

### Default Target Accounts (Pre-configured):
- **For Likes**: @elonmusk, @sundarpichai, @satyanadella, @tim_cook
- **For Retweets**: @OpenAI, @Google, @Microsoft  
- **For Comments**: @Apple, @Meta

### Automation Controls:
- **Auto-Posting**: ✅ Enable/Disable automatic content posting
- **AI Replies**: ✅ Generate smart replies to comments on your posts
- **Auto-Engagement**: ✅ Like, retweet, comment on target accounts
- **Cross-Platform**: ✅ Post to all connected platforms

### Niche Management:
- **Current**: Technology (default)
- **Switch to**: Crypto, Sports, Finance
- **Custom Keywords**: Fully customizable

---

## 🎯 Step 9: Verify Everything Works

### Check System Status:
```bash
# View application logs
sudo journalctl -u tech-news-bot.service -f

# Check system status
sudo systemctl status tech-news-bot.service
sudo systemctl status tech-news-display.service

# Test database connection
sudo -u automation psql tech_news_db -c "SELECT COUNT(*) FROM configurations;"
```

### In the Dashboard:
- ✅ All platform status indicators should be green
- ✅ Content aggregation should start immediately
- ✅ Activity feed should show real-time events
- ✅ Stats should update every 30 seconds

---

## 🔥 Step 10: Watch Your Empire Launch!

### What Happens Automatically:
1. **Content Aggregation** (every 15 minutes):
   - Fetches from TechCrunch, Ars Technica, The Verge, MacRumors
   - Filters duplicates and irrelevant content
   - AI rephrases content to remove source attribution

2. **Intelligent Posting** (real-time):
   - Posts new content across all platforms
   - Auto-threads long content on Twitter
   - Adds relevant hashtags and cross-links

3. **Smart Engagement** (every 2 minutes):
   - Likes tech posts from target accounts
   - Retweets high-quality content
   - Generates AI-powered comments

4. **Real-time Monitoring**:
   - Live activity feed shows all actions
   - System health monitoring
   - Engagement analytics tracking

---

## 🎛️ Advanced Configuration

### Customize Automation Behavior:
```bash
# Edit systemd service for advanced settings
sudo systemctl edit tech-news-bot.service

# Add custom environment variables:
[Service]
Environment=MAX_POSTS_PER_DAY=50
Environment=ENGAGEMENT_RATE_LIMIT=100
Environment=AUTO_REPLY_ENABLED=true
Environment=THREAD_MIN_LENGTH=300
```

### Custom RSS Sources:
Edit `/opt/tech-news-bot/server/services/contentAggregator.ts` to add your own RSS feeds.

### Human-like Behavior Tuning:
Adjust delays in `/opt/tech-news-bot/server/services/browserAutomation.ts`:
- Typing speed
- Action delays  
- Navigation timing

---

## 🔒 Security Best Practices

### Essential Security Steps:
```bash
# 1. Change default database password
sudo -u postgres psql -c "ALTER USER tech_news_user PASSWORD 'your_super_secure_password';"

# 2. Set up SSL certificate
sudo apt install certbot
sudo certbot --nginx -d your-domain.com

# 3. Enable fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban

# 4. Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### Firewall Configuration:
```bash
# Essential ports only
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 5000/tcp  # Dashboard
sudo ufw allow 443/tcp   # HTTPS (if using SSL)
```

---

## 📊 Monitoring and Maintenance

### Daily Checks:
```bash
# Check system health
curl http://localhost:5000/api/system/health

# View logs
sudo journalctl -u tech-news-bot.service --since "1 hour ago"

# Check database
sudo -u automation psql tech_news_db -c "SELECT COUNT(*) FROM posts WHERE created_at > NOW() - INTERVAL '24 hours';"
```

### Weekly Maintenance:
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Restart services for updates
sudo systemctl restart tech-news-bot.service

# Clean old logs
sudo journalctl --vacuum-time=7d
```

---

## 🆘 Troubleshooting

### Common Issues:

**Dashboard not loading:**
```bash
sudo systemctl status tech-news-bot.service
sudo journalctl -u tech-news-bot.service -n 50
```

**Browser automation failing:**
```bash
# Check if display service is running
sudo systemctl status tech-news-display.service

# Restart display service
sudo systemctl restart tech-news-display.service
```

**Database connection errors:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
sudo -u automation psql tech_news_db -c "SELECT version();"
```

**Twitter login issues:**
- Check credentials in dashboard
- Verify 2FA backup codes if enabled
- Clear browser sessions and re-login

---

## 🎉 Your Automation Empire is Live!

### Access Points:
- **Dashboard**: `http://your-server-ip:5000`
- **API Health**: `http://your-server-ip:5000/api/system/health`
- **SSH Access**: `ssh automation@your-server-ip`

### What You've Achieved:
✅ **Unlimited Twitter Posting** (bypasses API limits)  
✅ **AI-Powered Content Creation** with 3-key rotation  
✅ **Multi-Platform Distribution** (Twitter + Telegram + Facebook)  
✅ **Intelligent Engagement Automation**  
✅ **Real-time Analytics & Monitoring**  
✅ **Advanced Deduplication System**  
✅ **Niche Flexibility** (tech → crypto → sports → anything)  
✅ **Human-like Behavior Patterns**  
✅ **Persistent Browser Sessions**  
✅ **Comprehensive Error Handling**  
✅ **Production-Ready Infrastructure**  

### Your system is now:
- 🔄 **Processing content** every 15 minutes
- 📱 **Posting automatically** across platforms  
- 🤖 **Engaging intelligently** with target accounts
- 📈 **Tracking performance** in real-time
- 🛡️ **Operating securely** with encrypted credentials
- ⚡ **Scaling infinitely** with more accounts/niches

---

**Congratulations! Your tech news automation empire is now live and running 24/7! 🚀**

---

## 📞 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Review logs: `sudo journalctl -u tech-news-bot.service -f`
3. Verify all API keys are correctly set
4. Ensure all services are running: `sudo systemctl status tech-news-bot.service`

**Your automation system is designed to run reliably 24/7 and scale with your growing social media empire!**