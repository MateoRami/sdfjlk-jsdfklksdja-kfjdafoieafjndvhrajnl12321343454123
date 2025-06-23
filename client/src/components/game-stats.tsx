import { BarChart, TrendingUp, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Move } from "@shared/schema";
import { getProgress } from "@/lib/sudoku";

interface GameStatsProps {
  board: number[][];
  moves: Move[];
  errors: number;
}

export default function GameStats({ board, moves, errors }: GameStatsProps) {
  const progress = getProgress(board);
  const progressPercentage = Math.round((progress.completed / progress.total) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        <BarChart className="inline mr-2 text-green-500 h-5 w-5" />
        Estadísticas
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Celdas completadas:</span>
          <span className="font-semibold text-gray-900">
            {progress.completed}/{progress.total}
          </span>
        </div>
        
        <Progress value={progressPercentage} className="w-full" />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Movimientos totales:</span>
          <span className="font-semibold text-gray-900">{moves.length}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Errores cometidos:</span>
          <span className="font-semibold text-red-600">{errors}</span>
        </div>
      </div>
    </div>
  );
}
