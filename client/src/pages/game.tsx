import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Puzzle, Clock, AlertTriangle, Users } from "lucide-react";
import SudokuBoard from "@/components/sudoku-board";
import PlayerList from "@/components/player-list";
import RoomModal from "@/components/room-modal";
import GameStats from "@/components/game-stats";
import { useToast } from "@/hooks/use-toast";
import type { GameState, Player, Room, SudokuNotes, MoveType } from "@shared/schema";

export default function Game() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(true);
  const [, setGameTime] = useState(0); // Remove local game time
  const { toast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Polling for game state updates - faster polling for better responsiveness
  const { data: gameState, isLoading } = useQuery<GameState>({
    queryKey: [`/api/rooms/${currentRoom?.id}/state`],
    enabled: !!currentRoom,
    refetchInterval: 800, // Poll every 800ms for better responsiveness
  });

  // Update current player state when game state changes
  useEffect(() => {
    if (gameState && currentPlayer) {
      const updatedPlayer = gameState.players.find(p => p.id === currentPlayer.id);
      if (updatedPlayer) {
        setCurrentPlayer(updatedPlayer);
      }
    }
  }, [gameState, currentPlayer?.id]);

  // Timer effect
  useEffect(() => {
    if (!currentRoom || gameState?.room.isGameOver) return;
    
    const interval = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentRoom, gameState?.room.isGameOver]);

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (data: { name: string; difficulty: string; playerNickname: string; playerColor: string }) => {
      const response = await apiRequest("POST", "/api/rooms", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentRoom(data.room);
      setCurrentPlayer(data.player);
      setShowRoomModal(false);
      setGameTime(0);
      toast({
        title: "Sala creada",
        description: `Nombre de la sala: ${data.room.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (data: { code: string; nickname: string; color: string }) => {
      const response = await apiRequest("POST", `/api/rooms/${data.code}/join`, {
        nickname: data.nickname,
        color: data.color,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentRoom(data.room);
      setCurrentPlayer(data.player);
      setShowRoomModal(false);
      setGameTime(0);
      toast({
        title: "Unido a la sala",
        description: `Bienvenido a ${data.room.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Make move mutation with optimistic updates
  const makeMoveMutation = useMutation({
    mutationFn: async (data: { row: number; col: number; value?: number | null; notes?: number[]; moveType: MoveType }) => {
      const response = await apiRequest("POST", `/api/rooms/${currentRoom!.id}/moves`, {
        playerId: currentPlayer!.id,
        ...data,
      });
      return response.json();
    },
    onMutate: async (data) => {
      // Optimistic update for faster UI response
      if (gameState && data.moveType === 'number') {
        const newBoard = [...(gameState.room.board as number[][])];
        if (newBoard[data.row]) {
          newBoard[data.row][data.col] = data.value || 0;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${currentRoom?.id}/state`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update player selection mutation with minimal server sync
  const updateSelectionMutation = useMutation({
    mutationFn: async (data: { row: number; col: number; highlightedNumber?: number | null } | null) => {
      const response = await apiRequest("PUT", `/api/players/${currentPlayer!.id}/selection`, data || {});
      return response.json();
    },
    onSuccess: () => {
      // Don't invalidate queries immediately for better performance
      // Let the regular polling handle syncing
    },
  });

  // Toggle pencil mode mutation with optimistic updates
  const togglePencilMutation = useMutation({
    mutationFn: async (pencilMode: boolean) => {
      const response = await apiRequest("PUT", `/api/players/${currentPlayer!.id}/pencil`, { pencilMode });
      return response.json();
    },
    onMutate: async (pencilMode) => {
      // Optimistic update - update local state immediately
      if (currentPlayer) {
        setCurrentPlayer({
          ...currentPlayer,
          pencilMode: pencilMode,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${currentRoom?.id}/state`] });
    },
  });

  // Undo mutation
  const undoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/rooms/${currentRoom!.id}/undo/${currentPlayer!.id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${currentRoom?.id}/state`] });
      toast({
        title: "Movimiento deshecho",
        description: "Se ha revertido tu último movimiento",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave room mutation
  const leaveRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/players/${currentPlayer!.id}`);
      return response.json();
    },
    onSuccess: () => {
      setCurrentRoom(null);
      setCurrentPlayer(null);
      setShowRoomModal(true);
      setGameTime(0);
    },
  });

  const handleCellSelect = useCallback((row: number, col: number) => {
    const board = gameState?.room.board as number[][];
    const cellValue = board && board[row] ? board[row][col] : 0;
    const highlightedNumber = cellValue !== 0 ? cellValue : null;
    
    // Update local state immediately for instant feedback
    if (currentPlayer) {
      setCurrentPlayer({
        ...currentPlayer,
        selectedCell: { row, col },
        highlightedNumber,
      });
    }
    
    // Debounce server updates to reduce requests
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      updateSelectionMutation.mutate({ row, col, highlightedNumber });
    }, 150); // Wait 150ms before sending to server
  }, [gameState, currentPlayer, updateSelectionMutation]);

  const handleCellChange = (row: number, col: number, value: number | null) => {
    // Check if the number is already completed (9 times in correct positions)
    if (value && isNumberCompleted(value)) {
      toast({
        title: "Número completado",
        description: `El número ${value} ya está completo en el tablero`,
        variant: "destructive",
      });
      return;
    }
    
    makeMoveMutation.mutate({ row, col, value, moveType: 'number' });
  };
  
  // Helper function to check if a number is already completed
  const isNumberCompleted = (number: number): boolean => {
    if (!gameState?.room.board || !gameState?.room.solution) return false;
    
    const board = gameState.room.board as number[][];
    const solution = gameState.room.solution as number[][];
    let correctCount = 0;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === number && solution[row][col] === number) {
          correctCount++;
        }
      }
    }
    
    return correctCount >= 9;
  };

  const handleNoteChange = (row: number, col: number, notes: number[]) => {
    makeMoveMutation.mutate({ row, col, notes, moveType: 'note' });
  };

  const handleClear = (row: number, col: number) => {
    makeMoveMutation.mutate({ row, col, moveType: 'clear' });
  };

  const handleUndo = () => {
    undoMutation.mutate();
  };

  const handleTogglePencil = (enabled: boolean) => {
    togglePencilMutation.mutate(enabled);
  };

  const handleLeaveRoom = () => {
    leaveRoomMutation.mutate();
  };

  const handleNewGame = () => {
    // Reset game state
    setGameTime(0);
    queryClient.invalidateQueries({ queryKey: [`/api/rooms/${currentRoom?.id}/state`] });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate game time from server timestamps
  const getGameTime = (): number => {
    if (!gameState?.room.gameStartedAt) return 0;
    
    const startTime = new Date(gameState.room.gameStartedAt).getTime();
    const endTime = gameState.room.gameEndedAt 
      ? new Date(gameState.room.gameEndedAt).getTime()
      : Date.now();
    
    return Math.floor((endTime - startTime) / 1000);
  };

  // Update game time every second for live display
  const [currentGameTime, setCurrentGameTime] = useState(0);
  
  useEffect(() => {
    if (!gameState?.room) return;
    
    const updateTime = () => {
      setCurrentGameTime(getGameTime());
    };
    
    updateTime(); // Initial update
    
    if (!gameState.room.isGameOver) {
      const timer = setInterval(updateTime, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState?.room]);

  if (showRoomModal) {
    return (
      <RoomModal
        onCreateRoom={createRoomMutation.mutate}
        onJoinRoom={joinRoomMutation.mutate}
        isCreating={createRoomMutation.isPending}
        isJoining={joinRoomMutation.isPending}
      />
    );
  }

  if (!currentRoom || !currentPlayer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Puzzle className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Sudoku Colaborativo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sala: {currentRoom.code}</span>
              <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Game Board Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              
              {/* Game Status Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="text-red-500 h-4 w-4" />
                    <span className="text-sm font-medium text-gray-700">Errores:</span>
                    <Badge variant="destructive">
                      {gameState?.room.errors || 0}/3
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="text-blue-500 h-4 w-4" />
                    <span className="text-sm font-medium text-gray-700">Tiempo:</span>
                    <span className="text-sm text-gray-600">{formatTime(currentGameTime)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600">
                    En línea
                  </Badge>
                  {currentPlayer?.pencilMode && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Modo Lápiz
                    </Badge>
                  )}
                  <Select defaultValue={currentRoom.difficulty}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sudoku Board */}
              <SudokuBoard
                board={gameState?.room.board as number[][] || []}
                lockedCells={gameState?.room.lockedCells as boolean[][] || []}
                notes={gameState?.room.notes as SudokuNotes || []}
                incorrectCells={gameState?.room.incorrectCells as boolean[][] || []}
                players={gameState?.players || []}
                currentPlayer={currentPlayer}
                isGameOver={gameState?.room.isGameOver || false}
                solution={gameState?.room.solution as number[][] || []}
                onCellSelect={handleCellSelect}
                onCellChange={handleCellChange}
                onNoteChange={handleNoteChange}
                onClear={handleClear}
                onUndo={handleUndo}
                onTogglePencil={handleTogglePencil}
              />

              {gameState?.room.isGameOver && (
                <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                  <h2 className="text-2xl font-bold text-red-800 mb-4">¡Juego Terminado!</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{formatTime(currentGameTime)}</div>
                      <div className="text-sm text-gray-600">Tiempo jugado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{gameState.room.totalMoves || gameState.recentMoves.length}</div>
                      <div className="text-sm text-gray-600">Movimientos totales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{gameState.room.errors}</div>
                      <div className="text-sm text-gray-600">Errores cometidos</div>
                    </div>
                  </div>
                  <p className="text-red-700 mb-4">Se alcanzaron 3 errores. ¡Mejor suerte la próxima vez!</p>
                  <button
                    onClick={() => setShowRoomModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Jugar Nueva Partida
                  </button>
                </div>
              )}

              {/* Game Actions */}
              <div className="flex justify-center mt-6 space-x-4">
                <Button onClick={handleNewGame} disabled={!gameState?.room.isGameOver}>
                  Nuevo Juego
                </Button>
                {gameState?.room.isGameOver && (
                  <Button variant="destructive" onClick={handleLeaveRoom}>
                    Salir de la Sala
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Players List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <Users className="inline mr-2 text-blue-500 h-5 w-5" />
                Jugadores ({gameState?.players.length || 0})
              </h3>
              <PlayerList 
                players={gameState?.players || []} 
                currentPlayer={currentPlayer}
              />
            </div>

            {/* Game Statistics */}
            <GameStats
              board={gameState?.room.board as number[][] || []}
              moves={gameState?.recentMoves || []}
              errors={gameState?.room.errors || 0}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    navigator.clipboard.writeText(currentRoom.code);
                    toast({ title: "Código copiado", description: "El código de la sala ha sido copiado al portapapeles" });
                  }}
                >
                  Compartir Sala
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLeaveRoom}
                >
                  Salir de la Sala
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
