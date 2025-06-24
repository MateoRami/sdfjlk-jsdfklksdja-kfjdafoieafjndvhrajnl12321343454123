import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Puzzle } from "lucide-react";
import { PLAYER_COLORS } from "@shared/schema";

interface RoomModalProps {
  onCreateRoom: (data: { name: string; difficulty: string; playerNickname: string; playerColor: string }) => void;
  onJoinRoom: (data: { code: string; nickname: string; color: string }) => void;
  isCreating: boolean;
  isJoining: boolean;
}

export default function RoomModal({ onCreateRoom, onJoinRoom, isCreating, isJoining }: RoomModalProps) {
  const [joinCode, setJoinCode] = useState("");
  const [joinNickname, setJoinNickname] = useState("");
  const [joinColor, setJoinColor] = useState(PLAYER_COLORS[0]);
  
  const [createName, setCreateName] = useState("");
  const [createDifficulty, setCreateDifficulty] = useState("medium");
  const [createNickname, setCreateNickname] = useState("");
  const [createColor, setCreateColor] = useState(PLAYER_COLORS[0]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode && joinNickname && joinColor) {
      onJoinRoom({
        code: joinCode,
        nickname: joinNickname,
        color: joinColor,
      });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createName && createDifficulty && createNickname && createColor) {
      onCreateRoom({
        name: createName,
        difficulty: createDifficulty,
        playerNickname: createNickname,
        playerColor: createColor,
      });
    }
  };

  const ColorSelector = ({ selectedColor, onColorSelect }: { selectedColor: string; onColorSelect: (color: string) => void }) => (
    <div className="flex space-x-2">
      {PLAYER_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`w-8 h-8 rounded-full border-2 hover:border-gray-500 focus:border-blue-500 ${
            selectedColor === color ? 'border-blue-500' : 'border-gray-300'
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onColorSelect(color)}
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Puzzle className="text-white text-2xl" />
          </div>
          <CardTitle className="text-2xl">Sudoku Colaborativo</CardTitle>
          <CardDescription>Únete o crea una sala para empezar a jugar</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Unirse a Sala</TabsTrigger>
              <TabsTrigger value="create">Crear Sala</TabsTrigger>
            </TabsList>
            
            <TabsContent value="join">
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Código de Sala</Label>
                  <Input
                    id="joinCode"
                    placeholder="Ej: ROOM_ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="joinNickname">Tu Nickname</Label>
                  <Input
                    id="joinNickname"
                    placeholder="Ej: María_77"
                    value={joinNickname}
                    onChange={(e) => setJoinNickname(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Elige tu Color</Label>
                  <ColorSelector selectedColor={joinColor} onColorSelect={setJoinColor} />
                </div>
                
                <Button type="submit" className="w-full" disabled={isJoining}>
                  {isJoining ? "Uniéndose..." : "Unirse a la Sala"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="create">
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="createName">Nombre de la Sala</Label>
                  <Input
                    id="createName"
                    placeholder="Mi Sala de Sudoku"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="createDifficulty">Dificultad</Label>
                  <Select value={createDifficulty} onValueChange={setCreateDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil (35 celdas rellenas)</SelectItem>
                      <SelectItem value="medium">Medio (30 celdas rellenas)</SelectItem>
                      <SelectItem value="hard">Difícil (25 celdas rellenas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="createNickname">Tu Nickname</Label>
                  <Input
                    id="createNickname"
                    placeholder="Ej: María_77"
                    value={createNickname}
                    onChange={(e) => setCreateNickname(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Elige tu Color</Label>
                  <ColorSelector selectedColor={createColor} onColorSelect={setCreateColor} />
                </div>
                
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? "Creando..." : "Crear Sala"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
