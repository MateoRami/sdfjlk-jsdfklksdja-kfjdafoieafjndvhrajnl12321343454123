import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRoomSchema, insertPlayerSchema, insertMoveSchema, DIFFICULTIES } from "@shared/schema";
import { generateSudoku, solveSudoku, isValidMove } from "../client/src/lib/sudoku";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create room
  app.post("/api/rooms", async (req, res) => {
    try {
      const { name, difficulty, playerNickname, playerColor } = req.body;
      
      if (!name || !difficulty || !playerNickname || !playerColor) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!DIFFICULTIES[difficulty as keyof typeof DIFFICULTIES]) {
        return res.status(400).json({ message: "Invalid difficulty" });
      }

      // Generate unique room code
      const code = `ROOM_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Generate Sudoku puzzle
      const solution = generateSudoku();
      const board = createPuzzle(solution, DIFFICULTIES[difficulty as keyof typeof DIFFICULTIES].filledCells);
      const lockedCells = createLockedCells(board);

      const roomData = insertRoomSchema.parse({
        code,
        name,
        difficulty,
        board,
        solution,
        lockedCells,
        errors: 0,
        isGameOver: false,
      });

      const room = await storage.createRoom(roomData);

      // Create the room creator as first player
      const playerData = insertPlayerSchema.parse({
        roomId: room.id,
        nickname: playerNickname,
        color: playerColor,
        selectedCell: null,
        isOnline: true,
      });

      const player = await storage.createPlayer(playerData);

      res.json({ room, player });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  // Join room
  app.post("/api/rooms/:code/join", async (req, res) => {
    try {
      const { code } = req.params;
      const { nickname, color } = req.body;

      if (!nickname || !color) {
        return res.status(400).json({ message: "Missing nickname or color" });
      }

      const room = await storage.getRoomByCode(code);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Check if color is already taken
      const existingPlayers = await storage.getPlayersByRoom(room.id);
      if (existingPlayers.some(p => p.color === color && p.isOnline)) {
        return res.status(400).json({ message: "Color already taken" });
      }

      // Check if nickname is already taken
      if (existingPlayers.some(p => p.nickname === nickname && p.isOnline)) {
        return res.status(400).json({ message: "Nickname already taken" });
      }

      const playerData = insertPlayerSchema.parse({
        roomId: room.id,
        nickname,
        color,
        selectedCell: null,
        isOnline: true,
      });

      const player = await storage.createPlayer(playerData);

      res.json({ room, player });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  // Get game state
  app.get("/api/rooms/:roomId/state", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const gameState = await storage.getGameState(roomId);
      
      if (!gameState) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(gameState);
    } catch (error) {
      console.error("Error getting game state:", error);
      res.status(500).json({ message: "Failed to get game state" });
    }
  });

  // Make move
  app.post("/api/rooms/:roomId/moves", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { playerId, row, col, value } = req.body;

      if (playerId === undefined || row === undefined || col === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const room = await storage.getRoomByCode(roomId.toString());
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.isGameOver) {
        return res.status(400).json({ message: "Game is over" });
      }

      // Check if cell is locked
      const lockedCells = room.lockedCells as boolean[][];
      if (lockedCells[row][col]) {
        return res.status(400).json({ message: "Cell is locked" });
      }

      // Validate move
      const solution = room.solution as number[][];
      const isCorrect = value === null || solution[row][col] === value;

      // Update board
      const board = room.board as number[][];
      board[row][col] = value || 0;

      let newErrors = room.errors;
      if (value !== null && !isCorrect) {
        newErrors++;
      }

      const isGameOver = newErrors >= 3;

      // Update room
      await storage.updateRoom(room.id, {
        board,
        errors: newErrors,
        isGameOver,
      });

      // Record move
      const moveData = insertMoveSchema.parse({
        roomId: room.id,
        playerId,
        row,
        col,
        value,
        isCorrect,
      });

      await storage.createMove(moveData);

      // Get updated game state
      const gameState = await storage.getGameState(room.id);
      res.json(gameState);
    } catch (error) {
      console.error("Error making move:", error);
      res.status(500).json({ message: "Failed to make move" });
    }
  });

  // Update player selection
  app.put("/api/players/:playerId/selection", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const { row, col } = req.body;

      const selectedCell = (row !== undefined && col !== undefined) ? { row, col } : null;

      const player = await storage.updatePlayer(playerId, {
        selectedCell,
        isOnline: true,
      });

      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json(player);
    } catch (error) {
      console.error("Error updating player selection:", error);
      res.status(500).json({ message: "Failed to update selection" });
    }
  });

  // Leave room
  app.delete("/api/players/:playerId", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      await storage.removePlayer(playerId);
      res.json({ message: "Player removed" });
    } catch (error) {
      console.error("Error removing player:", error);
      res.status(500).json({ message: "Failed to remove player" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function createPuzzle(solution: number[][], filledCells: number): number[][] {
  const puzzle = solution.map(row => [...row]);
  const totalCells = 81;
  const cellsToRemove = totalCells - filledCells;
  
  const positions = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }
  
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // Remove cells
  for (let i = 0; i < cellsToRemove; i++) {
    const [row, col] = positions[i];
    puzzle[row][col] = 0;
  }
  
  return puzzle;
}

function createLockedCells(board: number[][]): boolean[][] {
  return board.map(row => row.map(cell => cell !== 0));
}
