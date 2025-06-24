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

      // Check if room with this name already exists
      const existingRoom = await storage.getRoomByCode(name);
      if (existingRoom) {
        return res.status(400).json({ message: "Una sala con este nombre ya existe. Elige otro nombre." });
      }
      
      // Use the room name as the code
      const code = name;
      
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
        notes: Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])),
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
        highlightedNumber: null,
        pencilMode: false,
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
        highlightedNumber: null,
        pencilMode: false,
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
      const { playerId, row, col, value, notes, moveType } = req.body;

      if (playerId === undefined || row === undefined || col === undefined || !moveType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const gameState = await storage.getGameState(roomId);
      if (!gameState) {
        return res.status(404).json({ message: "Room not found" });
      }
      const room = gameState.room;

      if (room.isGameOver) {
        return res.status(400).json({ message: "Game is over" });
      }

      // Check if cell is locked
      const lockedCells = room.lockedCells as boolean[][];
      if (lockedCells[row][col]) {
        return res.status(400).json({ message: "Cell is locked" });
      }

      const board = room.board as number[][];
      const roomNotes = room.notes as number[][][];
      const solution = room.solution as number[][];
      let isCorrect = true;
      let newErrors = room.errors;

      if (moveType === 'number') {
        // Validate move
        isCorrect = value === null || solution[row][col] === value;
        
        // Update board
        board[row][col] = value || 0;
        
        // Clear notes from this cell
        roomNotes[row][col] = [];
        
        // If correct number, remove it from related notes in row, column, and box
        if (value !== null && isCorrect) {
          removeNumberFromRelatedNotes(roomNotes, row, col, value);
        }
        
        // Only increment errors if placing incorrect number (not for clearing)
        if (value !== null && !isCorrect) {
          newErrors++;
        }
      } else if (moveType === 'note') {
        // Update notes
        roomNotes[row][col] = notes || [];
        isCorrect = true; // Notes are always "correct"
      } else if (moveType === 'clear') {
        // Clear cell
        board[row][col] = 0;
        roomNotes[row][col] = [];
        isCorrect = true;
      }

      const isGameOver = newErrors >= 3;

      // Update room
      await storage.updateRoom(room.id, {
        board,
        notes: roomNotes,
        errors: newErrors,
        isGameOver,
      });

      // Record move
      const moveData = insertMoveSchema.parse({
        roomId: room.id,
        playerId,
        row,
        col,
        value: moveType === 'number' ? value : null,
        notes: moveType === 'note' ? notes : null,
        moveType,
        isCorrect,
      });

      await storage.createMove(moveData);

      // Get updated game state
      const updatedGameState = await storage.getGameState(room.id);
      res.json(updatedGameState);
    } catch (error) {
      console.error("Error making move:", error);
      res.status(500).json({ message: "Failed to make move" });
    }
  });

  // Update player selection
  app.put("/api/players/:playerId/selection", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const { row, col, highlightedNumber } = req.body;

      const selectedCell = (row !== undefined && col !== undefined) ? { row, col } : null;

      const player = await storage.updatePlayer(playerId, {
        selectedCell,
        highlightedNumber: highlightedNumber || null,
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

  // Toggle pencil mode
  app.put("/api/players/:playerId/pencil", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const { pencilMode } = req.body;

      const player = await storage.updatePlayer(playerId, {
        pencilMode: pencilMode || false,
        isOnline: true,
      });

      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json(player);
    } catch (error) {
      console.error("Error updating pencil mode:", error);
      res.status(500).json({ message: "Failed to update pencil mode" });
    }
  });

  // Undo last move
  app.post("/api/rooms/:roomId/undo/:playerId", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const playerId = parseInt(req.params.playerId);

      const gameState = await storage.getGameState(roomId);
      if (!gameState) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Get player's last move
      const playerMoves = Array.from(storage['moves'].values())
        .filter(move => move.roomId === roomId && move.playerId === playerId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (playerMoves.length === 0) {
        return res.status(400).json({ message: "No moves to undo" });
      }

      const lastMove = playerMoves[0];
      const room = gameState.room;
      const board = room.board as number[][];
      const roomNotes = room.notes as number[][][];

      // Revert the move
      if (lastMove.moveType === 'number') {
        board[lastMove.row][lastMove.col] = 0;
      } else if (lastMove.moveType === 'note') {
        roomNotes[lastMove.row][lastMove.col] = [];
      }

      // Remove the move from storage
      storage['moves'].delete(lastMove.id);

      // Update room
      await storage.updateRoom(room.id, {
        board,
        notes: roomNotes,
      });

      // Get updated game state
      const updatedGameState = await storage.getGameState(room.id);
      res.json(updatedGameState);
    } catch (error) {
      console.error("Error undoing move:", error);
      res.status(500).json({ message: "Failed to undo move" });
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

function removeNumberFromRelatedNotes(notes: number[][][], row: number, col: number, number: number) {
  // Remove from same row
  for (let c = 0; c < 9; c++) {
    if (notes[row] && notes[row][c]) {
      notes[row][c] = notes[row][c].filter(n => n !== number);
    }
  }
  
  // Remove from same column
  for (let r = 0; r < 9; r++) {
    if (notes[r] && notes[r][col]) {
      notes[r][col] = notes[r][col].filter(n => n !== number);
    }
  }
  
  // Remove from same 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (notes[r] && notes[r][c]) {
        notes[r][c] = notes[r][c].filter(n => n !== number);
      }
    }
  }
}
