# Overview

This is an AI-powered trading chart analysis application that accepts chart images and provides professional trading signals through computer vision and AI analysis. The system is built as a full-stack web application with a React frontend and Express backend, designed to analyze candlestick charts and generate consistent, non-random trading signals based on technical indicators.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with dark theme by default
- **State Management**: React Query (@tanstack/react-query) for server state and caching
- **Routing**: Wouter for client-side routing
- **File Upload**: React Dropzone for drag-and-drop chart image uploads
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **File Processing**: Multer for handling multipart file uploads (images up to 5MB)
- **Image Analysis**: OpenAI GPT-5 API for chart validation and technical analysis
- **Data Storage**: In-memory storage with interface for future database integration
- **API Design**: RESTful endpoints for chart analysis and history retrieval

## Data Storage Architecture
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Chart analyses table with technical indicators stored as JSONB
- **Current Implementation**: Memory-based storage with database-ready schema
- **Caching Strategy**: Consistent analysis results based on image hash to prevent duplicate processing

## Chart Analysis Engine
- **Validation Layer**: AI-powered chart authenticity verification
- **Technical Indicators**: 12 indicators including RSI, MACD, Bollinger Bands, moving averages
- **Signal Generation**: Multi-indicator confluence analysis producing Call/Put signals with confidence levels
- **Consistency**: SHA-256 image hashing ensures identical images produce identical results

## File Upload System
- **Supported Formats**: PNG, JPEG, WebP
- **Size Limits**: 50KB minimum, 5MB maximum
- **Processing**: Base64 encoding for AI analysis
- **Validation**: File type and size validation before processing

# External Dependencies

## AI Services
- **OpenAI API**: GPT-5 model for chart validation and technical analysis
- **Image Processing**: Base64 encoding for chart image analysis

## Database
- **Neon Database**: Serverless PostgreSQL configured via DATABASE_URL
- **Connection**: @neondatabase/serverless driver
- **Migration**: Drizzle Kit for database schema management

## Development Tools
- **Replit Integration**: Vite plugin for development environment
- **Build System**: ESBuild for server bundling, Vite for client builds
- **TypeScript**: Full type safety across client, server, and shared schemas

## UI Libraries
- **Component System**: Extensive Radix UI component collection
- **Icons**: Lucide React icon library
- **Styling**: Tailwind CSS with custom design tokens
- **Animations**: CSS-based animations and transitions

## Validation and Forms
- **Schema Validation**: Zod for runtime type checking
- **Form Management**: React Hook Form with resolver integration
- **File Validation**: Custom validators for image types and sizes