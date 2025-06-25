import { 
  rooms, 
  players, 
  moves, 
  type Room, 
  type Player, 
  type Move, 
  type InsertRoom, 
  type InsertPlayer, 
  type InsertMove,
  type GameState,
  type SudokuBoard
} from "@shared/schema";

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined>;
  
  // Player operations
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayersByRoom(roomId: number): Promise<Player[]>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined>;
  removePlayer(id: number): Promise<void>;
  
  // Move operations
  createMove(move: InsertMove): Promise<Move>;
  getRecentMoves(roomId: number, limit?: number): Promise<Move[]>;
  
  // Game state
  getGameState(roomId: number): Promise<GameState | undefined>;
}

export class MemStorage implements IStorage {
  private rooms: Map<number, Room> = new Map();
  private players: Map<number, Player> = new Map();
  private moves: Map<number, Move> = new Map();
  private currentRoomId = 1;
  private currentPlayerId = 1;
  private currentMoveId = 1;

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    const now = new Date();
    const room: Room = {
      ...insertRoom,
      id,
      errors: insertRoom.errors || 0,
      isGameOver: insertRoom.isGameOver || false,
      notes: insertRoom.notes || Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])),
      gameStartedAt: now, // Initialize timer when room is created
      gameEndedAt: null,
      totalMoves: insertRoom.totalMoves || 0,
      incorrectCells: insertRoom.incorrectCells || Array(9).fill(null).map(() => Array(9).fill(false)),
      createdAt: now,
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.code === code);
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const player: Player = {
      ...insertPlayer,
      id,
      selectedCell: insertPlayer.selectedCell || null,
      highlightedNumber: insertPlayer.highlightedNumber || null,
      pencilMode: insertPlayer.pencilMode || false,
      isOnline: insertPlayer.isOnline !== undefined ? insertPlayer.isOnline : true,
      lastSeen: new Date(),
    };
    this.players.set(id, player);
    return player;
  }

  async getPlayersByRoom(roomId: number): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.roomId === roomId);
  }

  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates, lastSeen: new Date() };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async removePlayer(id: number): Promise<void> {
    this.players.delete(id);
  }

  async createMove(insertMove: InsertMove): Promise<Move> {
    const id = this.currentMoveId++;
    const move: Move = {
      ...insertMove,
      id,
      value: insertMove.value || null,
      notes: insertMove.notes || null,
      moveType: insertMove.moveType || 'number',
      timestamp: new Date(),
    };
    this.moves.set(id, move);
    return move;
  }

  async getRecentMoves(roomId: number, limit = 10): Promise<Move[]> {
    return Array.from(this.moves.values())
      .filter(move => move.roomId === roomId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getGameState(roomId: number): Promise<GameState | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    
    const players = await this.getPlayersByRoom(roomId);
    const recentMoves = await this.getRecentMoves(roomId, 5);
    
    return {
      room,
      players,
      recentMoves,
    };
  }
}

export const storage = new MemStorage();
