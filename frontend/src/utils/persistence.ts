/** localStorage key names — these MUST NOT change (see FR-014, FR-027) */
export type PersistenceKey =
  | 'magic-robots-data'
  | 'username'
  | 'font-size'
  | 'show-keyboard'
  | 'graphics-mode'
  | 'quality-preset'
  | 'fling-record'
  | 'story-pos-x'
  | 'story-pos-y'
  | 'story-visited-rooms'
  | 'story-inventory-items'
  | 'story-room-inventories'
  | 'story-room-unlocked-directions'
  | 'story-unlocked-items'
  | 'story-death-counter'
  | 'story-completion-items'
  | 'story-flashlight-status'
  | 'story-cake-status'
  | 'story-is-initial-visit';

const KEY_MAGIC_ROBOTS_DATA: PersistenceKey = 'magic-robots-data';

// app level
const KEY_USERNAME: PersistenceKey = 'username';
const KEY_FONT_SIZE: PersistenceKey = 'font-size';
const KEY_SHOW_KEYBOARD: PersistenceKey = 'show-keyboard';
const KEY_GRAPHICS_MODE: PersistenceKey = 'graphics-mode';
const KEY_QUALITY_PRESET: PersistenceKey = 'quality-preset';

// fling
const KEY_FLING_RECORD: PersistenceKey = 'fling-record';

// story level
const KEY_STORY_POS_X: PersistenceKey = 'story-pos-x';
const KEY_STORY_POS_Y: PersistenceKey = 'story-pos-y';
const KEY_STORY_VISITED_ROOMS: PersistenceKey = 'story-visited-rooms';
const KEY_STORY_INVENTORY_ITEMS: PersistenceKey = 'story-inventory-items';
const KEY_STORY_ROOM_INVENTORIES: PersistenceKey = 'story-room-inventories';
const KEY_STORY_ROOM_UNLOCKED_DIRECTIONS: PersistenceKey = 'story-room-unlocked-directions';
const KEY_STORY_UNLOCKED_ITEMS: PersistenceKey = 'story-unlocked-items';
const KEY_STORY_DEATH_COUNTER: PersistenceKey = 'story-death-counter';
const KEY_STORY_COMPLETION_ITEMS: PersistenceKey = 'story-completion-items';
const KEY_FLASHLIGHT_STATUS: PersistenceKey = 'story-flashlight-status';
const KEY_CAKE_STATUS: PersistenceKey = 'story-cake-status';
const KEY_STORY_IS_INITIAL_VISIT: PersistenceKey = 'story-is-initial-visit';

// Internal shape of the persisted object
type StorageRecord = Record<string, unknown>;

function _getStorageObject(): StorageRecord {
  const dataAsString = window.localStorage.getItem(KEY_MAGIC_ROBOTS_DATA);
  return dataAsString != null ? (JSON.parse(dataAsString) as StorageRecord) : {};
}

let magicRobotsData: StorageRecord = _getStorageObject();

function _setStorageObject(): void {
  const dataAsString = JSON.stringify(magicRobotsData);
  window.localStorage.setItem(KEY_MAGIC_ROBOTS_DATA, dataAsString);
}

// --------------------- app vars ------------------------

export function setUsername(value: string): void {
  magicRobotsData[KEY_USERNAME] = value;
  _setStorageObject();
}

export function getUsername(): string | null {
  return (_getStorageObject()[KEY_USERNAME] as string | undefined) ?? null;
}

export function setFontSize(value: string): void {
  const validEntries = ['l', 'm', 's'];
  if (validEntries.includes(value)) {
    magicRobotsData[KEY_FONT_SIZE] = value;
    _setStorageObject();
  }
}

export function getFontSize(): string | null {
  return (_getStorageObject()[KEY_FONT_SIZE] as string | undefined) ?? null;
}

export function setShowKeyboard(value: boolean): void {
  magicRobotsData[KEY_SHOW_KEYBOARD] = value;
  _setStorageObject();
}

export function getShowKeyboard(): boolean {
  const raw = _getStorageObject()[KEY_SHOW_KEYBOARD];
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') return ['true', '1', 'yes'].includes(raw);
  return false;
}

export function setGraphicsMode(value: string): void {
  if (['hi', 'lo'].includes(value)) {
    magicRobotsData[KEY_GRAPHICS_MODE] = value;
    _setStorageObject();
  }
}

export function getGraphicsMode(): string | null {
  return (_getStorageObject()[KEY_GRAPHICS_MODE] as string | undefined) ?? null;
}

// Callback invoked whenever the quality preset changes.
// Set by IzaComputer on mount so it can react immediately to preset changes.
let _onQualityPresetChange: ((preset: string) => void) | null = null;

export function setQualityPreset(value: string): void {
  const validPresets = ['high', 'normal', 'low'];
  if (validPresets.includes(value)) {
    magicRobotsData[KEY_QUALITY_PRESET] = value;
    _setStorageObject();
    if (_onQualityPresetChange) {
      _onQualityPresetChange(value);
    }
  }
}

export function getQualityPreset(): string | null {
  return (_getStorageObject()[KEY_QUALITY_PRESET] as string | undefined) ?? null;
}

/** Register a callback to be invoked whenever the quality preset changes. */
export function onQualityPresetChange(callback: (preset: string) => void): void {
  _onQualityPresetChange = callback;
}

// --------------------- fling game vars ------------------------

export function setFlingRecord(value: number): void {
  magicRobotsData[KEY_FLING_RECORD] = value;
  _setStorageObject();
}

export function getFlingRecord(): number {
  return (_getStorageObject()[KEY_FLING_RECORD] as number | undefined) ?? 0;
}

// --------------------- story vars ------------------------

export function setStoryPosX(value: number): void {
  magicRobotsData[KEY_STORY_POS_X] = value;
  _setStorageObject();
}

export function getStoryPosX(): number {
  return (_getStorageObject()[KEY_STORY_POS_X] as number | undefined) ?? 0;
}

export function setStoryPosY(value: number): void {
  magicRobotsData[KEY_STORY_POS_Y] = value;
  _setStorageObject();
}

export function getStoryPosY(): number {
  return (_getStorageObject()[KEY_STORY_POS_Y] as number | undefined) ?? 0;
}

export function setStoryDeaths(value: number): void {
  magicRobotsData[KEY_STORY_DEATH_COUNTER] = value;
  _setStorageObject();
}

export function getStoryDeaths(): number {
  return (_getStorageObject()[KEY_STORY_DEATH_COUNTER] as number | undefined) ?? 0;
}

export function addStoryVisitedRoom(roomId: string): void {
  let currRooms = getStoryVisitedRooms();
  if (!currRooms.includes(roomId)) {
    currRooms = [...currRooms, roomId];
  }
  magicRobotsData[KEY_STORY_VISITED_ROOMS] = currRooms;
  _setStorageObject();
}

export function getStoryVisitedRooms(): string[] {
  return (_getStorageObject()[KEY_STORY_VISITED_ROOMS] as string[] | undefined) ?? [];
}

export function getStoryInventoryItems(): number[] {
  return (_getStorageObject()[KEY_STORY_INVENTORY_ITEMS] as number[] | undefined) ?? [];
}

export function addStoryInventoryItem(itemId: number): void {
  let currItems = getStoryInventoryItems();
  if (!currItems.includes(itemId)) {
    currItems = [...currItems, itemId];
  }
  magicRobotsData[KEY_STORY_INVENTORY_ITEMS] = currItems;
  _setStorageObject();
}

export function removeStoryInventoryItem(itemId: number): void {
  const currItems = getStoryInventoryItems();
  magicRobotsData[KEY_STORY_INVENTORY_ITEMS] = currItems.filter((id) => id !== itemId);
  _setStorageObject();
}

export function getStoryRoomInventories(): Record<string, number[]> {
  return (
    (_getStorageObject()[KEY_STORY_ROOM_INVENTORIES] as Record<string, number[]> | undefined) ?? {}
  );
}

export function addItemToRoom(roomId: string, itemId: number): void {
  const inventories = getStoryRoomInventories();
  const roomItems = inventories[roomId] ?? [];
  if (!roomItems.includes(itemId)) {
    inventories[roomId] = [...roomItems, itemId];
  } else {
    inventories[roomId] = roomItems;
  }
  magicRobotsData[KEY_STORY_ROOM_INVENTORIES] = inventories;
  _setStorageObject();
}

export function removeItemFromRoom(roomId: string, itemId: number): void {
  const inventories = getStoryRoomInventories();
  const roomItems = inventories[roomId] ?? [];
  inventories[roomId] = roomItems.filter((id) => id !== itemId);
  magicRobotsData[KEY_STORY_ROOM_INVENTORIES] = inventories;
  _setStorageObject();
}

export function getIsUnlockedDirectionFromRoom(roomId: string, direction: string): boolean {
  type UnlockEntry = { roomId: string; unlocked: string[] };
  const unlockedPairs = (
    (_getStorageObject()[KEY_STORY_ROOM_UNLOCKED_DIRECTIONS] as UnlockEntry[] | undefined) ?? []
  );
  const roomEntry = unlockedPairs.find((r) => r.roomId === roomId);
  return roomEntry != null ? roomEntry.unlocked.includes(direction) : false;
}

export function setIsUnlockedDirectionInRoom(roomId: string, direction: string): void {
  type UnlockEntry = { roomId: string; unlocked: string[] };
  const unlockedPairs: UnlockEntry[] = (
    (_getStorageObject()[KEY_STORY_ROOM_UNLOCKED_DIRECTIONS] as UnlockEntry[] | undefined) ?? []
  );
  const roomEntry = unlockedPairs.find((r) => r.roomId === roomId);
  if (roomEntry != null) {
    if (!roomEntry.unlocked.includes(direction)) {
      roomEntry.unlocked = [...roomEntry.unlocked, direction];
    }
  } else {
    unlockedPairs.push({ roomId, unlocked: [direction] });
  }
  magicRobotsData[KEY_STORY_ROOM_UNLOCKED_DIRECTIONS] = unlockedPairs;
  _setStorageObject();
}

export function getAllUnlockedItems(): number[] {
  return (_getStorageObject()[KEY_STORY_UNLOCKED_ITEMS] as number[] | undefined) ?? [];
}

export function unlockItem(itemId: number): void {
  const currUnlocked = getAllUnlockedItems();
  if (!currUnlocked.includes(itemId)) {
    magicRobotsData[KEY_STORY_UNLOCKED_ITEMS] = [...currUnlocked, itemId];
    _setStorageObject();
  }
}

export function getStoryCompletionItemsCollected(): string[] {
  return (
    (_getStorageObject()[KEY_STORY_COMPLETION_ITEMS] as string[] | undefined) ?? []
  );
}

export function addStoryCompletionItemCollected(itemId: string): void {
  const currItems = getStoryCompletionItemsCollected();
  if (!currItems.includes(itemId)) {
    magicRobotsData[KEY_STORY_COMPLETION_ITEMS] = [...currItems, itemId];
    _setStorageObject();
  }
}

export function setFlashlightStatus(value: string): void {
  magicRobotsData[KEY_FLASHLIGHT_STATUS] = value;
  _setStorageObject();
}

export function getFlashlightStatus(): string | null {
  return (_getStorageObject()[KEY_FLASHLIGHT_STATUS] as string | undefined) ?? null;
}

export function setCakeStatus(value: string): void {
  magicRobotsData[KEY_CAKE_STATUS] = value;
  _setStorageObject();
}

export function getCakeStatus(): string | null {
  return (_getStorageObject()[KEY_CAKE_STATUS] as string | undefined) ?? null;
}

export function setStoryIsInitialVisit(value: boolean): void {
  magicRobotsData[KEY_STORY_IS_INITIAL_VISIT] = value;
  _setStorageObject();
}

export function getStoryIsInitialVisit(): boolean {
  const raw = _getStorageObject()[KEY_STORY_IS_INITIAL_VISIT];
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') return ['true', '1', 'yes'].includes(raw);
  return false;
}
