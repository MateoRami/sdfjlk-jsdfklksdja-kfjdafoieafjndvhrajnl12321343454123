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
- January 3, 2025. Victory system and UI improvements:
  * Added victory detection when puzzle is completed correctly
  * Victory screen with green styling and celebration message
  * Game over system now handles both win and loss conditions
  * Modal system for new game selection with difficulty options
  * Removed duplicate buttons from game over screen
  * Solution display in green when game is lost
  * Difficulty selector replaced with current difficulty badge
- January 3, 2025. Project migration and pencil mode improvements:
  * Successfully migrated from Replit Agent to standard Replit environment
  * Enhanced pencil mode functionality for better note management
  * Notes remain persistent when incorrect numbers are placed
  * Smart note removal from row/column/box when correct numbers are placed
  * Improved UI responsiveness with optimistic updates and faster polling
  * Added smooth transitions and instant visual feedback for better UX
  * Improved visual feedback with blue-colored notes
  * Better user experience with clearer instructions
  * Enhanced cell highlighting: ALL cells in same row/column/block now highlight with player's color
  * More opaque highlighting (bg-200 instead of bg-50) for better visibility
  * Selected cell borders now match player's color for better identification
  * Improved Sudoku grid with thick borders between 3x3 blocks and thin borders between cells
  * Fixed border alignment issues ensuring proper block separation
  * Changed to uniform 4-sided borders for selected cells using border-4 instead of ring-4
  * Added number highlighting feature: selecting any cell (including locked cells) highlights all cells with the same number in light blue
  * Made number highlighting personal - only the player who selected the cell sees the highlighting, not all players
  * Improved responsiveness with faster polling (800ms) and reduced selection debounce (150ms)
  * Added completed number blocking - numbers that appear 9 times correctly are disabled in input pad and keyboard
  * Added optimistic updates for moves to make input feel more responsive
  * Made number highlighting more intense for editable cells (blue-200 vs blue-100)
- June 25, 2025. Toggle deletion feature:
  * Added toggle deletion - entering the same number that's already in a cell will delete it
  * Works with both keyboard input and number pad buttons
  * Provides intuitive way to remove numbers without using delete/clear buttons
- June 25, 2025. Game completion and timer improvements:
  * Added proper game over system when 3 errors are reached
  * Implemented global room timer that syncs across all players
  * Timer starts when room is created and stops when game ends
  * Players joining mid-game see the correct elapsed time
  * Added game over screen with final statistics (time, moves, errors)
  * Added "New Game" button to restart with different difficulty
- June 25, 2025. Logical Sudoku generation:
  * Implemented advanced puzzle generation that ensures solvability through logic alone
  * Added algorithms for naked singles and hidden singles detection
  * Puzzles now guarantee at least one logical move is always available
  * No more guessing required - every puzzle can be solved step by step using deduction
  * Fallback system ensures puzzle generation even in edge cases
- June 24, 2025. Room system improvements:
  * Room name now serves as the access code - no more random codes
  * Users can create rooms with custom names that others can join directly
  * Added validation to prevent duplicate room names
  * Updated UI to clarify that room name = access code
- June 24, 2025. Advanced game mechanics:
  * Auto-locking of completed rows, columns, and 3x3 blocks
  * Incorrect numbers displayed in red for all players
  * Enhanced visual feedback for wrong moves
  * Improved game progression with automatic cell protection
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```