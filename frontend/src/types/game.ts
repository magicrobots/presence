// frontend/src/types/game.ts
// Game state types — managed by game modules in frontend/src/utils/game/

export interface GameState {
  posX: number;
  posY: number;
  visitedRooms: string[];
  deaths: number;
  completionItems: string[];
  isInitialVisit: boolean;
}

export interface StoryItem {
  id: number;
  name: string;
  type: 'key' | 'passive' | 'document' | 'consumable' | 'tool' | 'misc';
  weight: number;
  description: string;
  isLocked?: boolean;
  passiveKeyFor?: number[];   // Room exit IDs this item passively unlocks
}

export interface RoomInventory {
  roomId: string;
  itemIds: number[];
}

export type ExitDirection = 'n' | 's' | 'e' | 'w' | 'u' | 'd';

export interface RoomExit {
  direction: ExitDirection;
  targetRoomId: string;
  lockKeyId?: number | number[];   // Item(s) required to unlock
  isUnlockedByDefault?: boolean;
}

export interface Room {
  id: string;
  x: number;
  y: number;
  name: string;
  description: string;
  exits: RoomExit[];
  isDarkTrap?: boolean;
  isAirlock?: boolean;
  isInSpace?: boolean;
}

export type FlashlightStatus = 'on' | 'off' | 'dead';

export interface FlashlightState {
  status: FlashlightStatus;
  batteryLevel: number;   // 0–100
}
