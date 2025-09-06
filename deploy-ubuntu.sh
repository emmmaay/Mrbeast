#!/bin/bash

# Tech News Automation Bot - Ubuntu Deployment Script
# Run this script on your Ubuntu server to set up the complete automation system

set -e

echo "🚀 Starting Tech News Automation Bot deployment on Ubuntu..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Chrome for browser automation
echo "📦 Installing Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install google-chrome-stable -y

# Install additional dependencies for browser automation
echo "📦 Installing browser automation dependencies..."
sudo apt install -y xvfb x11vnc fluxbox wget wmctrl

# Create automation user
echo "👤 Creating automation user..."
sudo useradd -m -s /bin/bash automation || echo "User automation already exists"

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/tech-news-bot
sudo chown automation:automation /opt/tech-news-bot

# Switch to automation user and set up the application
sudo -u automation bash << 'EOF'
cd /opt/tech-news-bot

# Clone or copy your application files here
# For now, we'll create the necessary structure

echo "📂 Creating application structure..."
mkdir -p server client shared

# Create package.json
cat > package.json << 'PACKAGE_JSON'
{
  "name": "tech-news-automation",
  "version": "1.0.0",
  "description": "Multi-platform tech news automation system",
  "scripts": {
    "start": "NODE_ENV=production tsx server/index.ts",
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run build:client",
    "build:client": "cd client && npm run build",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "drizzle-orm": "^0.30.0",
    "drizzle-zod": "^0.5.1",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.1",
    "ws": "^8.16.0",
    "tsx": "^4.7.0",
    "zod": "^3.22.0",
    "puppeteer": "^21.0.0",
    "puppeteer-extra": "^3.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "node-telegram-bot-api": "^0.63.0",
    "rss-parser": "^3.13.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.17.10",
    "@types/ws": "^8.5.10",
    "drizzle-kit": "^0.20.0",
    "typescript": "^5.3.0"
  }
}
PACKAGE_JSON

echo "📦 Installing Node.js dependencies..."
npm install

EOF

# Create systemd service
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/tech-news-bot.service > /dev/null << 'SERVICE'
[Unit]
Description=Tech News Automation Bot
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=automation
Group=automation
WorkingDirectory=/opt/tech-news-bot
Environment=NODE_ENV=production
Environment=DISPLAY=:1
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Environment variables (set these with your actual values)
Environment=DATABASE_URL=postgresql://tech_news_user:your_password@localhost:5432/tech_news_db
Environment=GROQ_API_KEY_1=your_groq_key_1
Environment=GROQ_API_KEY_2=your_groq_key_2
Environment=GROQ_API_KEY_3=your_groq_key_3
Environment=NEWS_API_KEY=your_news_api_key
Environment=TELEGRAM_BOT_TOKEN=your_telegram_token
Environment=FACEBOOK_PAGE_TOKEN=your_facebook_token

[Install]
WantedBy=multi-user.target
SERVICE

# Create virtual display service for browser automation
echo "🖥️  Creating virtual display service..."
sudo tee /etc/systemd/system/tech-news-display.service > /dev/null << 'DISPLAY_SERVICE'
[Unit]
Description=Virtual Display for Tech News Bot
Before=tech-news-bot.service

[Service]
Type=simple
User=automation
Group=automation
ExecStart=/usr/bin/Xvfb :1 -screen 0 1920x1080x24
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
DISPLAY_SERVICE

# Set up PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."
sudo -u postgres psql << 'POSTGRES_SETUP'
CREATE USER tech_news_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE tech_news_db OWNER tech_news_user;
GRANT ALL PRIVILEGES ON DATABASE tech_news_db TO tech_news_user;
\q
POSTGRES_SETUP

# Create environment configuration file
echo "📝 Creating environment configuration..."
sudo -u automation tee /opt/tech-news-bot/.env << 'ENV_FILE'
# Database Configuration
DATABASE_URL=postgresql://tech_news_user:your_secure_password_here@localhost:5432/tech_news_db

# AI Configuration (Get from Groq Console)
GROQ_API_KEY_1=your_groq_api_key_1
GROQ_API_KEY_2=your_groq_api_key_2
GROQ_API_KEY_3=your_groq_api_key_3

# News API (Get from NewsAPI.org)
NEWS_API_KEY=your_news_api_key

# Social Media API Keys (Optional - for API-based posting)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
FACEBOOK_PAGE_TOKEN=your_facebook_page_token

# Application Configuration
NODE_ENV=production
PORT=5000

# Browser Automation Settings
HEADLESS=true
BROWSER_TIMEOUT=30000
HUMAN_DELAY_MIN=2000
HUMAN_DELAY_MAX=8000
ENV_FILE

# Create log directory
echo "📋 Setting up logging..."
sudo mkdir -p /var/log/tech-news-bot
sudo chown automation:automation /var/log/tech-news-bot

# Create log rotation configuration
sudo tee /etc/logrotate.d/tech-news-bot << 'LOGROTATE'
/var/log/tech-news-bot/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 automation automation
    postrotate
        systemctl reload tech-news-bot
    endscript
}
LOGROTATE

# Enable and start services
echo "🚀 Enabling and starting services..."
sudo systemctl daemon-reload
sudo systemctl enable tech-news-display.service
sudo systemctl enable tech-news-bot.service
sudo systemctl start tech-news-display.service

# Install browser automation dependencies
echo "🌐 Installing Puppeteer dependencies..."
sudo -u automation bash << 'EOF'
cd /opt/tech-news-bot
node -e "
const puppeteer = require('puppeteer');
(async () => {
  try {
    console.log('Installing Chromium for Puppeteer...');
    const browser = await puppeteer.launch();
    await browser.close();
    console.log('Puppeteer setup complete!');
  } catch (error) {
    console.error('Puppeteer setup failed:', error);
  }
})();
"
EOF

# Create firewall rules
echo "🔒 Setting up firewall..."
sudo ufw allow 5000/tcp comment "Tech News Bot Dashboard"
sudo ufw allow 22/tcp comment "SSH"

# Final setup instructions
echo "✅ Installation complete!"
echo ""
echo "🔧 NEXT STEPS - IMPORTANT:"
echo "1. Edit /opt/tech-news-bot/.env with your actual API keys"
echo "2. Copy your application files to /opt/tech-news-bot/"
echo "3. Update database password in systemd service:"
echo "   sudo systemctl edit tech-news-bot.service"
echo "4. Start the application:"
echo "   sudo systemctl start tech-news-bot.service"
echo "5. Check status:"
echo "   sudo systemctl status tech-news-bot.service"
echo "6. View logs:"
echo "   sudo journalctl -u tech-news-bot.service -f"
echo ""
echo "🌐 Dashboard will be available at: http://your-server-ip:5000"
echo ""
echo "📱 Default target accounts include:"
echo "   • @elonmusk, @sundarpichai, @satyanadella (for likes)"
echo "   • @OpenAI, @Google, @Microsoft (for retweets)"
echo "   • @Apple, @Meta (for comments)"
echo ""
echo "🔑 API Keys needed:"
echo "   • Groq API (3 keys for rotation): https://console.groq.com/"
echo "   • News API: https://newsapi.org/"
echo "   • Telegram Bot Token: https://t.me/BotFather"
echo "   • Facebook Page Token: https://developers.facebook.com/"
echo ""
echo "⚠️  SECURITY REMINDERS:"
echo "   • Change default database password"
echo "   • Set up SSL/TLS certificate"
echo "   • Enable fail2ban for SSH protection"
echo "   • Regular security updates"
echo ""
echo "🎉 Your automation empire is ready to launch!"