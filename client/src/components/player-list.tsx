import { Badge } from "@/components/ui/badge";
import { Circle, Crown } from "lucide-react";
import type { Player } from "@shared/schema";

interface PlayerListProps {
  players: Player[];
  currentPlayer: Player;
}

export default function PlayerList({ players, currentPlayer }: PlayerListProps) {
  const getPlayerStatus = (player: Player) => {
    if (player.selectedCell) {
      const cell = player.selectedCell as any;
      return `Editando celda (${cell.row + 1},${cell.col + 1})`;
    }
    return "Observando";
  };

  const getPlayerBorderColor = (color: string) => {
    const colorMap: Record<string, string> = {
      '#EF4444': 'border-red-200 bg-red-50',
      '#3B82F6': 'border-blue-200 bg-blue-50',
      '#10B981': 'border-green-200 bg-green-50',
      '#F59E0B': 'border-yellow-200 bg-yellow-50',
      '#8B5CF6': 'border-purple-200 bg-purple-50',
      '#EC4899': 'border-pink-200 bg-pink-50',
    };
    return colorMap[color] || 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="space-y-3">
      {players.map((player) => (
        <div
          key={player.id}
          className={`flex items-center space-x-3 p-2 rounded-lg border ${
            player.id === currentPlayer.id
              ? 'border-blue-200 bg-blue-50'
              : getPlayerBorderColor(player.color)
          }`}
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: player.color }}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {player.id === currentPlayer.id ? `Tú (${player.nickname})` : player.nickname}
              </span>
              <div className="flex items-center space-x-2">
                {player.id === currentPlayer.id && (
                  <Badge variant="outline" className="text-blue-600">
                    <Crown className="w-3 h-3 mr-1" />
                    Tú
                  </Badge>
                )}
                <Badge variant="outline" className="text-green-600">
                  <Circle className="w-2 h-2 mr-1 fill-current" />
                  En línea
                </Badge>
              </div>
            </div>
            <p className="text-xs text-gray-500">{getPlayerStatus(player)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
