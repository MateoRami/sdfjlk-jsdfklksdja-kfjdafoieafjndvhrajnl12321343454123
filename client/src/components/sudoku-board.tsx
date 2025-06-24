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
    
    // Base class
    let className = "relative w-10 h-10 text-center font-bold border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all duration-150 cursor-pointer ";
    
    // Base background
    if (isLocked) {
      className += "bg-gray-100 ";
    } else {
      className += "bg-white ";
    }
    
    // Check if this is my selected cell (local state has priority for instant feedback)
    const isMySelectedCell = selectedCell?.row === row && selectedCell?.col === col;
    const isMyServerSelectedCell = !isMySelectedCell && currentPlayer?.selectedCell && 
                                   (currentPlayer.selectedCell as any).row === row && 
                                   (currentPlayer.selectedCell as any).col === col;
    
    // Check if another player has this cell selected
    const otherPlayerColor = getPlayerColorForCell(row, col);
    const isOtherPlayerCell = otherPlayerColor && !isMySelectedCell && !isMyServerSelectedCell;
    
    // Get my active selected cell for range highlighting
    const myActiveSelectedCell = selectedCell || (currentPlayer?.selectedCell as any);
    const isInMyRange = myActiveSelectedCell && 
      myActiveSelectedCell.row !== undefined && 
      myActiveSelectedCell.col !== undefined && (
        myActiveSelectedCell.row === row || 
        myActiveSelectedCell.col === col || 
        (Math.floor(myActiveSelectedCell.row / 3) === Math.floor(row / 3) && 
         Math.floor(myActiveSelectedCell.col / 3) === Math.floor(col / 3))
      );
    
    // Apply styling in order of priority
    
    // 1. Highlight same numbers (lowest priority, only if no other highlighting)
    const shouldHighlightNumber = currentPlayer?.highlightedNumber && 
                                  cellValue !== 0 && 
                                  cellValue === currentPlayer.highlightedNumber;
    if (shouldHighlightNumber && !isInMyRange && !isMySelectedCell && !isMyServerSelectedCell && !isOtherPlayerCell) {
      className += "bg-blue-200 ";
    }
    
    // 2. Highlight my range (row/column/box) - USAR COLORES ESPECÍFICOS
    if (isInMyRange && !isMySelectedCell && !isMyServerSelectedCell && !isOtherPlayerCell) {
      const playerColor = currentPlayer?.color;
      if (playerColor === '#EF4444') className += "bg-red-200 ";           // Rojo
      else if (playerColor === '#3B82F6') className += "bg-blue-200 ";     // Azul  
      else if (playerColor === '#10B981') className += "bg-green-200 ";    // Verde
      else if (playerColor === '#F59E0B') className += "bg-yellow-200 ";   // Amarillo
      else if (playerColor === '#8B5CF6') className += "bg-purple-200 ";   // Morado
      else if (playerColor === '#EC4899') className += "bg-pink-200 ";     // Rosa
      else className += "bg-gray-200 ";
    }
    
    // 3. Other players' selections - USAR COLORES ESPECÍFICOS
    if (isOtherPlayerCell) {
      if (otherPlayerColor === '#EF4444') className += "ring-2 ring-red-500 ";     // Rojo
      else if (otherPlayerColor === '#3B82F6') className += "ring-2 ring-blue-500 ";   // Azul
      else if (otherPlayerColor === '#10B981') className += "ring-2 ring-green-500 ";  // Verde
      else if (otherPlayerColor === '#F59E0B') className += "ring-2 ring-yellow-500 "; // Amarillo
      else if (otherPlayerColor === '#8B5CF6') className += "ring-2 ring-purple-500 "; // Morado
      else if (otherPlayerColor === '#EC4899') className += "ring-2 ring-pink-500 ";   // Rosa
      else className += "ring-2 ring-gray-500 ";
    }
    
    // 4. My selected cell - USAR COLORES ESPECÍFICOS  
    if (isMySelectedCell || isMyServerSelectedCell) {
      const playerColor = currentPlayer?.color || '#3B82F6';
      if (playerColor === '#EF4444') className += "ring-4 ring-red-500 bg-red-300 ";        // Rojo
      else if (playerColor === '#3B82F6') className += "ring-4 ring-blue-500 bg-blue-300 ";    // Azul
      else if (playerColor === '#10B981') className += "ring-4 ring-green-500 bg-green-300 ";  // Verde
      else if (playerColor === '#F59E0B') className += "ring-4 ring-yellow-500 bg-yellow-300 ";// Amarillo
      else if (playerColor === '#8B5CF6') className += "ring-4 ring-purple-500 bg-purple-300 ";// Morado
      else if (playerColor === '#EC4899') className += "ring-4 ring-pink-500 bg-pink-300 ";    // Rosa
      else className += "ring-4 ring-blue-500 bg-blue-300 ";
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
