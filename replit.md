# Collaborative Sudoku Game

## Overview

This is a real-time collaborative Sudoku web application built with React, Express.js, and Drizzle ORM. Players can create or join rooms to solve Sudoku puzzles together, with real-time updates showing other players' selections and moves.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Wouter** for client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS** with **shadcn/ui** components for styling
- **Radix UI** primitives for accessible component foundation

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design for game operations
- **Polling-based** real-time updates (2-second intervals)
- **In-memory storage** (MemStorage class) for development
- **Drizzle ORM** configured for PostgreSQL (production-ready)

### Data Storage Solutions
- **Development**: In-memory storage with Map-based data structures
- **Production**: PostgreSQL database with Drizzle ORM
- **Session Management**: Ready for connect-pg-simple integration
- **Database Migrations**: Configured with drizzle-kit

## Key Components

### Game Logic
- **Sudoku Generation**: Custom algorithm for creating valid 9x9 puzzles
- **Validation**: Real-time move validation against Sudoku rules
- **Difficulty Levels**: Easy, Medium, Hard with different cell counts
- **Error Tracking**: Persistent error counting per room

### Real-time Collaboration
- **Player Management**: Nickname, color assignment, online status
- **Cell Selection**: Visual indicators showing which player is editing which cell
- **Move History**: Complete audit trail of all player moves
- **Game State Synchronization**: Polling-based updates every 2 seconds

### UI Components
- **Sudoku Board**: Interactive 9x9 grid with visual feedback
- **Player List**: Real-time display of active players and their status
- **Room Management**: Create/join room modals with validation
- **Game Statistics**: Progress tracking and move analytics

## Data Flow

1. **Room Creation**: Player creates room → generates Sudoku puzzle → creates first player
2. **Room Joining**: Player joins with code → validates room exists → adds player to room
3. **Game Updates**: Client polls server every 2 seconds → receives complete game state
4. **Move Processing**: Player makes move → validates against solution → updates board → broadcasts to all players
5. **Player Tracking**: Cell selection updates → real-time position sharing → visual feedback

## External Dependencies

### Core Runtime
- **@neondatabase/serverless**: PostgreSQL connection for production
- **drizzle-orm**: Type-safe database operations
- **express**: Web server framework

### UI Framework
- **@radix-ui/***: Accessible component primitives
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **drizzle-kit**: Database schema management

## Deployment Strategy

### Development
- **Replit Environment**: Configured with Node.js 20, PostgreSQL 16
- **Hot Reloading**: Vite dev server with HMR
- **Database**: Can use in-memory storage or PostgreSQL

### Production
- **Build Process**: Vite builds client, esbuild bundles server
- **Deployment Target**: Autoscale configuration
- **Database**: PostgreSQL with connection pooling
- **Static Assets**: Served from Express with built React app

### Environment Configuration
- **DATABASE_URL**: Required for PostgreSQL connection
- **NODE_ENV**: Controls development vs production behavior
- **Port Configuration**: Defaults to 5000, external port 80

## Changelog

```
Changelog:
- June 23, 2025. Initial setup
- June 23, 2025. Added advanced board features:
  * Pencil mode for collaborative notes
  * Smart note removal when correct numbers are placed
  * Clear and Undo functionality
  * Number highlighting and collaborative cell highlighting
  * Enhanced visual feedback for row/column/box relationships
  * Mobile-friendly number input pad
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```