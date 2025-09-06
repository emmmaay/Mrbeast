# Tech News Automation Bot

## Overview

This is a sophisticated tech news automation bot that aggregates content from RSS feeds, processes it with AI, and automatically publishes to multiple social media platforms (Twitter/X, Telegram, Facebook). The system features real-time monitoring, engagement automation, content scheduling, and comprehensive analytics tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern component-based UI built with React 18 and TypeScript for type safety
- **Wouter**: Lightweight client-side routing solution for navigation
- **Vite**: Fast build tool and development server with HMR support
- **TanStack Query**: Server state management with caching, background updates, and optimistic UI
- **Tailwind CSS + shadcn/ui**: Utility-first styling with a comprehensive component library
- **Real-time WebSocket Connection**: Live updates for dashboard metrics, activity feed, and system status

### Backend Architecture
- **Express.js**: RESTful API server with middleware for logging, error handling, and request processing
- **Service-Oriented Architecture**: Modular design with dedicated services for different functionalities:
  - `AIProcessor`: Content rephrasing using Groq API with key rotation
  - `ContentAggregator`: RSS feed parsing and content collection
  - `PlatformAutomation`: Social media posting and engagement automation
  - `AnalyticsService`: System metrics collection and performance tracking
- **WebSocket Server**: Real-time bidirectional communication for live updates
- **Scheduled Jobs**: Automated content processing, posting, and engagement actions

### Data Storage Solutions
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database queries with schema validation
- **Connection Pool**: Optimized database connections using Neon's connection pooling
- **Comprehensive Schema**: Tables for posts, analytics, configurations, engagement logs, content queue, target accounts, system stats, and activity feed

### Authentication and Authorization
- Session-based authentication using `connect-pg-simple` for PostgreSQL session storage
- Configuration-based access control for different automation features
- Environment variable protection for API keys and sensitive data

### External Service Integrations
- **Groq AI API**: Multiple API keys with rotation for content processing and rephrasing
- **RSS Feed Sources**: Technology news from TechCrunch, Ars Technica, The Verge, MacRumors, and O'Reilly Radar
- **Social Media APIs**: Integration endpoints for Twitter/X, Telegram, and Facebook posting
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **WebSocket Protocol**: Real-time communication between client and server

### Key Architectural Decisions

**Monorepo Structure**: Single repository with shared schema and types between client and server for consistency and type safety. This reduces duplication and ensures frontend-backend compatibility.

**Service Layer Pattern**: Business logic separated into dedicated service classes (AIProcessor, ContentAggregator, etc.) for maintainability and testability. Each service handles a specific domain concern.

**Real-time Architecture**: WebSocket implementation for live dashboard updates, activity monitoring, and system status. This provides immediate feedback without polling.

**Configuration-Driven Automation**: Database-stored configuration system allowing runtime changes to automation behavior without code deployment. Supports feature toggles and dynamic settings.

**Queue-Based Processing**: Content queue system for scheduled publishing with retry mechanisms and error handling. Ensures reliable content delivery across platforms.

**Multi-Key API Management**: Groq API key rotation system to handle rate limits and ensure high availability for AI processing tasks.

**Responsive Design System**: Mobile-first approach using Tailwind CSS with shadcn/ui components for consistent cross-device experience.