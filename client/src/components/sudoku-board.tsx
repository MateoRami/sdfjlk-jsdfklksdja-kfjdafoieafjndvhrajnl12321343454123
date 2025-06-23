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
    
    onCellSelect(row, col);
    
    // If in pencil mode, load existing notes
    if (currentPlayer.pencilMode && notes[row] && notes[row][col]) {
      setPendingNotes([...notes[row][col]]);
    } else {
      setPendingNotes([]);
    }
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    if (isGameOver || lockedCells[row]?.[col] || board[row][col] !== 0) return;
    
    const numValue = value === "" ? null : parseInt(value);
    if (numValue !== null && (numValue < 1 || numValue > 9)) return;
    
    if (currentPlayer.pencilMode && numValue !== null) {
      // Handle notes
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
    } else {
      // Handle regular number input
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
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const playerColor = getPlayerColorForCell(row, col);
    const cellValue = board[row][col];
    
    // Check if this cell should be highlighted due to same number
    const shouldHighlightNumber = currentPlayer.highlightedNumber && 
                                  cellValue !== 0 && 
                                  cellValue === currentPlayer.highlightedNumber;
    
    // Check if cell is in same row, column, or box as current player's selected cell
    const mySelectedCell = currentPlayer.selectedCell as any;
    const isInMyGroup = mySelectedCell && (
      mySelectedCell.row === row || 
      mySelectedCell.col === col || 
      (Math.floor(mySelectedCell.row / 3) === Math.floor(row / 3) && 
       Math.floor(mySelectedCell.col / 3) === Math.floor(col / 3))
    );
    
    let className = "relative w-10 h-10 text-center font-bold border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all cursor-pointer ";
    
    if (isLocked) {
      className += "bg-gray-100 ";
    } else {
      className += "bg-white focus:bg-blue-50 ";
    }
    
    // Highlight same numbers
    if (shouldHighlightNumber) {
      className += "bg-blue-200 ";
    }
    
    // Highlight related cells for current player only
    if (isInMyGroup && mySelectedCell && !isSelected) {
      const colorMap: Record<string, string> = {
        '#EF4444': 'bg-red-100',
        '#3B82F6': 'bg-blue-100',
        '#10B981': 'bg-green-100',
        '#F59E0B': 'bg-yellow-100',
        '#8B5CF6': 'bg-purple-100',
        '#EC4899': 'bg-pink-100',
      };
      className += colorMap[currentPlayer.color] || 'bg-gray-100';
      className += " bg-opacity-40 ";
    }
    
    // Currently selected cell
    if (isSelected) {
      className += "ring-4 ring-blue-500 bg-blue-50 ";
    }
    
    // Other players' selections
    if (playerColor && !isSelected) {
      className += `ring-2 `;
      const colorMap: Record<string, string> = {
        '#EF4444': 'ring-red-500',
        '#3B82F6': 'ring-blue-500',
        '#10B981': 'ring-green-500',
        '#F59E0B': 'ring-yellow-500',
        '#8B5CF6': 'ring-purple-500',
        '#EC4899': 'ring-pink-500',
      };
      className += colorMap[playerColor] || 'ring-gray-500';
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
      {currentPlayer.pencilMode && (
        <div className="text-center text-sm text-purple-600 font-medium mb-2">
          Modo lápiz activo - Haz clic en números para agregar/quitar notas
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
                      
                      {/* Notes display */}
                      {notes[rowIndex] && notes[rowIndex][colIndex] && notes[rowIndex][colIndex].length > 0 && board[rowIndex][colIndex] === 0 && (
                        <div className="absolute inset-0 pointer-events-none p-0.5">
                          <div className="grid grid-cols-3 gap-0 w-full h-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <div key={num} className="flex items-center justify-center text-xs font-medium text-gray-600">
                                {notes[rowIndex][colIndex].includes(num) ? num : ''}
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
                currentPlayer.pencilMode && selectedCell && notes[selectedCell.row] && notes[selectedCell.row][selectedCell.col] && notes[selectedCell.row][selectedCell.col].includes(num)
                  ? 'bg-blue-100 border-blue-500' 
                  : ''
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
