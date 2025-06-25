import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIFFICULTIES } from "@shared/schema";

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewGame: (difficulty: string) => void;
  isLoading: boolean;
}

export default function NewGameModal({ isOpen, onClose, onStartNewGame, isLoading }: NewGameModalProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");

  const handleStartGame = () => {
    onStartNewGame(selectedDifficulty);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Juego</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Selecciona la dificultad:
            </label>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Fácil</span>
                    <span className="text-xs text-gray-500">{DIFFICULTIES.easy.filledCells} celdas llenas</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Medio</span>
                    <span className="text-xs text-gray-500">{DIFFICULTIES.medium.filledCells} celdas llenas</span>
                  </div>
                </SelectItem>
                <SelectItem value="hard">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Difícil</span>
                    <span className="text-xs text-gray-500">{DIFFICULTIES.hard.filledCells} celdas llenas</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleStartGame}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Creando..." : "Empezar Juego"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}