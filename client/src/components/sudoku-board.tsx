import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Eraser, Undo2, Trash2 } from "lucide-react";
import type { Player, SudokuNotes, MoveType } from "@shared/schema";

interface SudokuBoardProps {
  board: number[][];
  lockedCells: boolean[][];
  notes: SudokuNotes;
  incorrectCells?: boolean[][];
  players: Player[];
  currentPlayer: Player;
  isGameOver: boolean;
  onCellSelect: (row: number, col: number) => void;
  onCellChange: (row: number, col: number, value: number | null) => void;
  onNoteChange: (row: number, col: number, notes: number[]) => void;
  onClear: (row: number, col: number) => void;
  onUndo: () => void;
  onTogglePencil: (enabled: boolean) => void;
}

export default function SudokuBoard({
  board,
  lockedCells,
  notes,
  incorrectCells,
  players,
  currentPlayer,
  isGameOver,
  onCellSelect,
  onCellChange,
  onNoteChange,
  onClear,
  onUndo,
  onTogglePencil,
}: SudokuBoardProps) {
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [pendingNotes, setPendingNotes] = useState<number[]>([]);

  const handleCellClick = (row: number, col: number) => {
    if (isGameOver) return;
    
    const newSelection = { row, col };
    setSelectedCell(newSelection);
    
    // Call selection callback immediately for instant UI feedback
    onCellSelect(row, col);
    
    // If not locked and in pencil mode, load existing notes
    if (!lockedCells[row]?.[col] && currentPlayer?.pencilMode && notes[row] && notes[row][col]) {
      setPendingNotes([...notes[row][col]]);
    } else {
      setPendingNotes([]);
    }
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    if (isGameOver || lockedCells[row]?.[col]) return;
    
    const numValue = value === "" ? null : parseInt(value);
    if (numValue !== null && (numValue < 1 || numValue > 9)) return;
    
    if (currentPlayer.pencilMode && numValue !== null) {
      // Handle notes - only if cell is empty
      if (board[row][col] === 0) {
        const currentNotes = notes[row] && notes[row][col] ? [...notes[row][col]] : [];
        if (currentNotes.includes(numValue)) {
          // Remove note
          const index = currentNotes.indexOf(numValue);
          currentNotes.splice(index, 1);
        } else {
          // Add note
          currentNotes.push(numValue);
          currentNotes.sort();
        }
        onNoteChange(row, col, currentNotes);
      }
    } else {
      // Handle regular number input - this will clear notes and place number
      onCellChange(row, col, numValue);
    }
  };

  const getPlayerColorForCell = (row: number, col: number) => {
    const player = players.find(p => 
      p.selectedCell && 
      (p.selectedCell as any).row === row && 
      (p.selectedCell as any).col === col
    );
    return player?.color;
  };

  const getCellStyle = (row: number, col: number) => {
    const isLocked = lockedCells[row]?.[col];
    const cellValue = board[row][col];
    
    // Check if this cell should be highlighted due to same number from any player
    let shouldHighlightNumber = false;
    for (const player of players) {
      if (player.highlightedNumber && cellValue !== 0 && cellValue === player.highlightedNumber) {
        shouldHighlightNumber = true;
        break;
      }
    }
    
    let className = "relative w-10 h-10 text-center font-bold border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all duration-150 cursor-pointer ";
    
    if (isLocked) {
      className += "bg-gray-300 ";
    } else {
      className += "bg-white focus:bg-blue-50 ";
    }

    // Highlight same numbers with light blue background
    if (shouldHighlightNumber) {
      if (isLocked) {
        className = className.replace('bg-gray-300', 'bg-blue-300');
      } else {
        className = className.replace('bg-white', 'bg-blue-100');
      }
    }
    
    // Check all players' selections and apply highlighting
    let isCurrentPlayerCell = false;
    let hasOtherPlayerSelection = false;
    let otherPlayerColor = '';
    
    // Check current player selection (prioritize local state for instant feedback)
    const isLocallySelected = selectedCell?.row === row && selectedCell?.col === col;
    const isServerSelected = !isLocallySelected && currentPlayer?.selectedCell && 
                            (currentPlayer.selectedCell as any).row === row && 
                            (currentPlayer.selectedCell as any).col === col;
    
    if (isLocallySelected || isServerSelected) {
      isCurrentPlayerCell = true;
    }
    
    // Check other players' selections
    for (const player of players) {
      if (player.id === currentPlayer.id) continue; // Skip current player
      
      if (player.selectedCell) {
        const playerRow = (player.selectedCell as any).row;
        const playerCol = (player.selectedCell as any).col;
        
        if (playerRow === row && playerCol === col) {
          hasOtherPlayerSelection = true;
          otherPlayerColor = player.color;
          break;
        }
      }
    }
    
    // Apply highlighting for current player's row/column/box
    if (selectedCell || currentPlayer?.selectedCell) {
      const activeSelectedCell = selectedCell || (currentPlayer?.selectedCell as any);
      
      // Check if this cell is in the same row, column, or box as current player's selection
      const isInSameRow = activeSelectedCell.row === row;
      const isInSameCol = activeSelectedCell.col === col;
      const isInSameBox = Math.floor(activeSelectedCell.row / 3) === Math.floor(row / 3) && 
                         Math.floor(activeSelectedCell.col / 3) === Math.floor(col / 3);
      
      if ((isInSameRow || isInSameCol || isInSameBox) && !isCurrentPlayerCell && !hasOtherPlayerSelection) {
        // Apply background highlight with current player's color
        if (isLocked) {
          // For locked cells, use darker shade of player color
          const colorMap: Record<string, string> = {
            '#EF4444': 'bg-red-400',
            '#3B82F6': 'bg-blue-400', 
            '#10B981': 'bg-green-400',
            '#F59E0B': 'bg-yellow-400',
            '#8B5CF6': 'bg-purple-400',
            '#EC4899': 'bg-pink-400',
          };
          const bgColor = colorMap[currentPlayer?.color || ''] || 'bg-gray-400';
          className = className.replace('bg-gray-300', bgColor);
        } else {
          // For regular cells, use lighter shade
          const colorMap: Record<string, string> = {
            '#EF4444': 'bg-red-200',
            '#3B82F6': 'bg-blue-200', 
            '#10B981': 'bg-green-200',
            '#F59E0B': 'bg-yellow-200',
            '#8B5CF6': 'bg-purple-200',
            '#EC4899': 'bg-pink-200',
          };
          const bgColor = colorMap[currentPlayer?.color || ''] || 'bg-gray-200';
          className = className.replace('bg-white', bgColor);
        }
      }
    }
    
    // Apply selection styles for current player
    if (isCurrentPlayerCell) {
      // Current player's selected cell gets even 4-sided border in their color
      const borderColorMap: Record<string, string> = {
        '#EF4444': 'border-4 border-red-500 bg-red-100',
        '#3B82F6': 'border-4 border-blue-500 bg-blue-100',
        '#10B981': 'border-4 border-green-500 bg-green-100', 
        '#F59E0B': 'border-4 border-yellow-500 bg-yellow-100',
        '#8B5CF6': 'border-4 border-purple-500 bg-purple-100',
        '#EC4899': 'border-4 border-pink-500 bg-pink-100',
      };
      const borderStyle = borderColorMap[currentPlayer?.color || ''] || 'border-4 border-blue-500 bg-blue-100';
      className += borderStyle + " ";
    }
    
    // Apply selection styles for other players
    if (hasOtherPlayerSelection) {
      const borderColorMap: Record<string, string> = {
        '#EF4444': 'border-2 border-red-500',
        '#3B82F6': 'border-2 border-blue-500',
        '#10B981': 'border-2 border-green-500',
        '#F59E0B': 'border-2 border-yellow-500', 
        '#8B5CF6': 'border-2 border-purple-500',
        '#EC4899': 'border-2 border-pink-500',
      };
      const borderStyle = borderColorMap[otherPlayerColor] || 'border-2 border-gray-500';
      className += borderStyle + " ";
    }
    
    return className;
  };



  const handleClear = () => {
    if (selectedCell && !isGameOver) {
      onClear(selectedCell.row, selectedCell.col);
      setPendingNotes([]);
    }
  };

  const handleTogglePencil = () => {
    const newMode = !currentPlayer.pencilMode;
    onTogglePencil(newMode);
    if (!newMode) {
      setPendingNotes([]);
    }
  };

  // Handle keyboard input focus
  const focusSelectedCell = () => {
    if (selectedCell) {
      const input = document.getElementById(`cell-${selectedCell.row}-${selectedCell.col}`);
      if (input) {
        input.focus();
      }
    }
  };

  if (!board || !board.length || !lockedCells || !lockedCells.length) {
    return <div className="flex justify-center items-center h-96">Cargando tablero...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Game Controls */}
      <div className="flex justify-center space-x-2 mb-2">
        <Button
          variant={currentPlayer.pencilMode ? "default" : "outline"}
          size="sm"
          onClick={handleTogglePencil}
          disabled={isGameOver}
          className={currentPlayer.pencilMode ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
        >
          <Pencil className="w-4 h-4 mr-1" />
          {currentPlayer.pencilMode ? "Lápiz Activo" : "Modo Lápiz"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isGameOver || !selectedCell || (selectedCell && lockedCells[selectedCell.row]?.[selectedCell.col])}
        >
          <Eraser className="w-4 h-4 mr-1" />
          Borrar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={isGameOver}
        >
          <Undo2 className="w-4 h-4 mr-1" />
          Deshacer
        </Button>
      </div>
      
      {/* Status indicator */}
      {currentPlayer?.pencilMode && (
        <div className="text-center text-sm text-purple-600 font-medium mb-4 p-2 bg-purple-50 rounded-lg border border-purple-200">
          <strong>Modo lápiz activo</strong> - Creando notas compartidas visibles para todos los jugadores
        </div>
      )}

      {/* Sudoku Board */}
      <div className="flex justify-center">
        <div className="inline-block bg-gray-900 p-1 rounded-lg">
          <div className="sudoku-grid">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${getCellStyle(rowIndex, colIndex)} sudoku-cell-${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {lockedCells[rowIndex]?.[colIndex] || board[rowIndex][colIndex] !== 0 ? (
                    <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${
                      incorrectCells?.[rowIndex]?.[colIndex] ? 'text-red-600' : ''
                    }`}>
                      {board[rowIndex][colIndex] !== 0 ? board[rowIndex][colIndex] : ''}
                    </div>
                  ) : (
                    <>
                      {/* Main number display or input */}
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                        {board[rowIndex][colIndex] !== 0 ? board[rowIndex][colIndex] : ''}
                      </div>
                      
                      {/* Notes display - 3x3 grid for empty cells - visible to all players */}
                      {board[rowIndex][colIndex] === 0 && (
                        <div className="absolute inset-0 pointer-events-none p-0.5 flex items-center justify-center">
                          <div className="grid grid-cols-3 gap-0 w-full h-full max-w-[36px] max-h-[36px]">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <div key={num} className="flex items-center justify-center text-[9px] font-bold text-blue-600 leading-none">
                                {notes[rowIndex] && notes[rowIndex][colIndex] && notes[rowIndex][colIndex].includes(num) ? num : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Hidden input for keyboard capture */}
                      <input
                        id={`cell-${rowIndex}-${colIndex}`}
                        type="text"
                        maxLength={1}
                        value=""
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' || e.key === 'Delete') {
                            handleClear();
                          }
                        }}
                        disabled={isGameOver}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ 
                          background: 'transparent',
                          border: 'none',
                          outline: 'none'
                        }}
                      />
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Number Input Pad (for mobile/easier input) */}
      <div className="flex justify-center">
        <div className="grid grid-cols-5 gap-2 max-w-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <Button
              key={num}
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedCell && !lockedCells[selectedCell.row]?.[selectedCell.col] && board[selectedCell.row][selectedCell.col] === 0) {
                  handleCellChange(selectedCell.row, selectedCell.col, num.toString());
                }
              }}
              disabled={isGameOver || !selectedCell || lockedCells[selectedCell?.row]?.[selectedCell?.col] || (selectedCell && board[selectedCell.row][selectedCell.col] !== 0)}
              className={`w-10 h-10 p-0 ${
                currentPlayer?.pencilMode && selectedCell && notes[selectedCell.row] && notes[selectedCell.row][selectedCell.col] && notes[selectedCell.row][selectedCell.col].includes(num)
                  ? 'bg-purple-100 border-purple-500 text-purple-700' 
                  : ''
              } ${
                currentPlayer?.pencilMode ? 'hover:bg-purple-50' : ''
              }`}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isGameOver || !selectedCell || lockedCells[selectedCell?.row]?.[selectedCell?.col]}
            className="w-10 h-10 p-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
