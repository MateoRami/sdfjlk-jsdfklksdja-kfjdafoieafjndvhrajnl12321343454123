import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { Player } from "@shared/schema";

interface SudokuBoardProps {
  board: number[][];
  lockedCells: boolean[][];
  players: Player[];
  currentPlayer: Player;
  isGameOver: boolean;
  onCellSelect: (row: number, col: number) => void;
  onCellChange: (row: number, col: number, value: number | null) => void;
}

export default function SudokuBoard({
  board,
  lockedCells,
  players,
  currentPlayer,
  isGameOver,
  onCellSelect,
  onCellChange,
}: SudokuBoardProps) {
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);

  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || lockedCells[row]?.[col]) return;
    
    const newSelection = { row, col };
    setSelectedCell(newSelection);
    onCellSelect(row, col);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    if (isGameOver || lockedCells[row]?.[col]) return;
    
    const numValue = value === "" ? null : parseInt(value);
    if (numValue !== null && (numValue < 1 || numValue > 9)) return;
    
    onCellChange(row, col, numValue);
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
    
    let className = "w-10 h-10 text-center font-bold border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 ";
    
    if (isLocked) {
      className += "bg-gray-100 ";
    } else {
      className += "bg-white focus:bg-blue-50 ";
    }
    
    if (playerColor && !isSelected) {
      className += `ring-2 `;
      // Map colors to ring classes
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

  if (!board || !board.length || !lockedCells || !lockedCells.length) {
    return <div className="flex justify-center items-center h-96">Cargando tablero...</div>;
  }

  return (
    <div className="flex justify-center">
      <div className="inline-block bg-gray-900 p-2 rounded-lg">
        <div className="grid grid-cols-9 gap-px">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <Input
                key={`${rowIndex}-${colIndex}`}
                type="text"
                maxLength={1}
                value={cell === 0 ? "" : cell.toString()}
                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                disabled={isGameOver || lockedCells[rowIndex]?.[colIndex]}
                className={getCellStyle(rowIndex, colIndex)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
