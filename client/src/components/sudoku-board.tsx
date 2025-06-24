import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Eraser, Undo2, Trash2 } from "lucide-react";
import type { Player, SudokuNotes, MoveType } from "@shared/schema";

interface SudokuBoardProps {
  board: number[][];
  lockedCells: boolean[][];
  notes: SudokuNotes;
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
    if (isGameOver || lockedCells[row]?.[col]) return;
    
    const newSelection = { row, col };
    setSelectedCell(newSelection);
    
    // Get highlighted number for this cell
    const cellValue = board[row][col];
    const highlightedNumber = cellValue !== 0 ? cellValue : null;
    
    // Call selection callback immediately for instant UI feedback
    onCellSelect(row, col);
    
    // If in pencil mode, load existing notes
    if (currentPlayer?.pencilMode && notes[row] && notes[row][col]) {
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
    
    // Check if this cell should be highlighted due to same number
    const shouldHighlightNumber = currentPlayer?.highlightedNumber && 
                                  cellValue !== 0 && 
                                  cellValue === currentPlayer.highlightedNumber;
    
    // Check if cell is in same row, column, or box as selected cell (prioritize local state)
    const activeSelectedCell = selectedCell || (currentPlayer?.selectedCell as any);
    const isInMyGroup = activeSelectedCell && (
      activeSelectedCell.row === row || 
      activeSelectedCell.col === col || 
      (Math.floor(activeSelectedCell.row / 3) === Math.floor(row / 3) && 
       Math.floor(activeSelectedCell.col / 3) === Math.floor(col / 3))
    );
    
    // Currently selected cell (prioritize local state for instant feedback)
    const isLocallySelected = selectedCell?.row === row && selectedCell?.col === col;
    const isServerSelected = !isLocallySelected && currentPlayer?.selectedCell && 
                            (currentPlayer.selectedCell as any).row === row && 
                            (currentPlayer.selectedCell as any).col === col;

    // Check for other players' selections
    const otherPlayerColor = getPlayerColorForCell(row, col);
    const isOtherPlayerSelected = otherPlayerColor && !(isLocallySelected || isServerSelected);
    
    let className = "relative w-10 h-10 text-center font-bold border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all duration-150 cursor-pointer ";
    
    // Base background
    if (isLocked) {
      className += "bg-gray-100 ";
    } else {
      className += "bg-white focus:bg-blue-50 ";
    }
    
    // Priority 1: Highlight same numbers (lowest priority)
    if (shouldHighlightNumber && !isInMyGroup && !isLocallySelected && !isServerSelected && !isOtherPlayerSelected) {
      className += "bg-blue-200 ";
    }
    
    // Priority 2: Highlight related cells for current player only
    if (isInMyGroup && activeSelectedCell && !(isLocallySelected || isServerSelected) && !isOtherPlayerSelected) {
      const colorMap: Record<string, string> = {
        '#EF4444': 'bg-red-200 ',      // Rojo
        '#3B82F6': 'bg-blue-200 ',     // Azul
        '#10B981': 'bg-emerald-200 ',  // Verde
        '#F59E0B': 'bg-amber-200 ',    // Amarillo/Amber
        '#8B5CF6': 'bg-violet-200 ',   // Morado/Violeta
        '#EC4899': 'bg-pink-200 ',     // Rosa
      };
      const playerColor = currentPlayer?.color || '';
      const bgClass = colorMap[playerColor];
      if (bgClass) {
        className += bgClass;
      } else {
        className += 'bg-gray-200 ';
      }
    }
    
    // Priority 3: Other players' selections
    if (isOtherPlayerSelected) {
      const colorMap: Record<string, string> = {
        '#EF4444': 'ring-red-500 ',      // Rojo
        '#3B82F6': 'ring-blue-500 ',     // Azul
        '#10B981': 'ring-emerald-500 ',  // Verde
        '#F59E0B': 'ring-amber-500 ',    // Amarillo/Amber
        '#8B5CF6': 'ring-violet-500 ',   // Morado/Violeta
        '#EC4899': 'ring-pink-500 ',     // Rosa
      };
      const ringClass = colorMap[otherPlayerColor || ''];
      if (ringClass) {
        className += `ring-2 ${ringClass}`;
      } else {
        className += 'ring-2 ring-gray-500 ';
      }
    }
    
    // Priority 4: Currently selected cell - highest priority
    if (isLocallySelected || isServerSelected) {
      const ringColorMap: Record<string, string> = {
        '#EF4444': 'ring-red-500 bg-red-300 ',      // Rojo
        '#3B82F6': 'ring-blue-500 bg-blue-300 ',     // Azul
        '#10B981': 'ring-emerald-500 bg-emerald-300 ', // Verde
        '#F59E0B': 'ring-amber-500 bg-amber-300 ',   // Amarillo/Amber
        '#8B5CF6': 'ring-violet-500 bg-violet-300 ', // Morado/Violeta
        '#EC4899': 'ring-pink-500 bg-pink-300 ',     // Rosa
      };
      const playerColor = currentPlayer?.color || '#3B82F6';
      const ringClass = ringColorMap[playerColor];
      if (ringClass) {
        className += `ring-4 ${ringClass}`;
      } else {
        className += 'ring-4 ring-blue-500 bg-blue-300 ';
      }
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
        <div className="inline-block bg-gray-900 p-2 rounded-lg">
          <div className="grid grid-cols-9 gap-px">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellStyle(rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {lockedCells[rowIndex]?.[colIndex] || board[rowIndex][colIndex] !== 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold">
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
