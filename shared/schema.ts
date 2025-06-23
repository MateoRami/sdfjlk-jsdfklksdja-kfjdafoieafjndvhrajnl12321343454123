import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  board: jsonb("board").notNull(), // 9x9 array of numbers (0 for empty)
  solution: jsonb("solution").notNull(), // 9x9 array with complete solution
  lockedCells: jsonb("locked_cells").notNull(), // 9x9 array of booleans
  notes: jsonb("notes").notNull().default('[]'), // 9x9 array of arrays with notes per cell
  errors: integer("errors").notNull().default(0),
  isGameOver: boolean("is_game_over").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  nickname: text("nickname").notNull(),
  color: text("color").notNull(),
  selectedCell: jsonb("selected_cell"), // {row: number, col: number} or null
  highlightedNumber: integer("highlighted_number"), // number being highlighted by this player
  pencilMode: boolean("pencil_mode").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(true),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

export const moves = pgTable("moves", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  row: integer("row").notNull(),
  col: integer("col").notNull(),
  value: integer("value"), // null for delete
  notes: jsonb("notes"), // array of numbers for notes
  moveType: text("move_type").notNull(), // 'number', 'note', 'clear'
  isCorrect: boolean("is_correct").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  lastSeen: true,
});

export const insertMoveSchema = createInsertSchema(moves).omit({
  id: true,
  timestamp: true,
});

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Move = typeof moves.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertMove = z.infer<typeof insertMoveSchema>;

// Additional types for game state
export type SudokuBoard = number[][];
export type SudokuNotes = number[][][]; // 9x9 array of arrays containing note numbers
export type CellSelection = { row: number; col: number } | null;
export type MoveType = 'number' | 'note' | 'clear';

export type GameState = {
  room: Room;
  players: Player[];
  recentMoves: Move[];
};

export const PLAYER_COLORS = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
] as const;

export const DIFFICULTIES = {
  easy: { name: 'Fácil', filledCells: 35 },
  medium: { name: 'Medio', filledCells: 30 },
  hard: { name: 'Difícil', filledCells: 25 },
} as const;
