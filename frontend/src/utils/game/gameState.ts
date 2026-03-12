/**
 * gameState.ts — Game-level state initialization and reporting.
 *
 * Extracted from storyCore.js as part of the US3 decomposition.
 * Covers: game init, completion, XP calculation, and new-game detection.
 * All persistence I/O goes through persistence.ts named exports.
 */

import rooms from '../../constants/story-rooms';
import items from '../../constants/story-items';
import environmentValues from '../../constants/environment-values';
import MagicNumbers from '../../constants/magic-numbers';
import * as persistence from '../persistence';

// --------------------------------------------------------------------------
// Private helpers
// --------------------------------------------------------------------------

function _getIsGameCompleted(): boolean {
  return (
    persistence.getStoryCompletionItemsCollected().length ===
    environmentValues.COMPLETION_ITEM_IDS.length
  );
}

function _getCurrentRoom() {
  const posX = persistence.getStoryPosX() || MagicNumbers.HOME_COORD_X;
  const posY = persistence.getStoryPosY() || MagicNumbers.HOME_COORD_Y;
  return rooms.getRoom({ x: posX, y: posY });
}

function _getRobotResponseUsed(): string {
  const remainingIds = environmentValues.COMPLETION_ITEM_IDS.filter(
    (x) => !persistence.getStoryCompletionItemsCollected().includes(String(x))
  );
  const remainingNames = remainingIds.map((currId) => {
    const item = items.getItemById(currId);
    return item?.name ?? String(currId);
  });
  const responses = [
    'Keep it up. Still need',
    'Keep going. Get me',
    `Still remaining ${remainingIds.length > 1 ? 'are' : 'is'}`,
  ];
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return `The robot booms "${randomResponse} the ${remainingNames.join(' and ')}."`;
}

function _handleAllItemsGiven(): string {
  // Remove robot from helipad
  persistence.removeItemFromRoom('10', 10);

  return "The robot looks at you for a moment, then jumps up into the air and fires a bunch of lasers into a nearby building. It pauses for a moment, then flies at horrifying speed towards some distant alien nest to eviscerate it. You stare after it for a few minutes, and realize for the first time in a long time that you are surrounded by quiet. It's really nice. You decide to go get some donuts.";
}

// --------------------------------------------------------------------------
// Public exports
// --------------------------------------------------------------------------

/**
 * Initialize (or reset) all story state to its starting values.
 * Equivalent to storyCore.formatStoryData().
 */
export function initGameState(): void {
  persistence.setStoryDeaths(0);
  persistence.setStoryPosX(MagicNumbers.HOME_COORD_X);
  persistence.setStoryPosY(MagicNumbers.HOME_COORD_Y);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy storyCore shape; will be replaced when persistence is fully typed
  (persistence as any).setStoryVisitedRooms([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy storyCore shape
  (persistence as any).setStoryInventoryItems(MagicNumbers.INIT_USER_INVENTORY);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy storyCore shape
  (persistence as any).setCakeEaten(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy storyCore shape
  (persistence as any).setIsInitialVisit(true);

  // Initialize room inventories
  const roomInventories: Record<string, number[]> = {
    '1': [...(MagicNumbers.INIT_ROOM_ONE_INVENTORY as readonly number[])],
    '2': [2, 5],
    '3': [4],
    '4': [6],
    '5': [7, 8],
    '6': [20],
    '7': [],
    '8': [21, 24],
    '9': [9],
    '10': [10],
    '11': [26],
    '12': [],
    '13': [],
    '14': [],
    '15': [11],
    '16': [13, 15],
    '17': [],
    '18': [],
    '19': [14, 22],
    '20': [],
    '21': [16],
    '22': [],
    '23': [],
    '24': [],
    '25': [19],
    '26': [18, 17],
    '27': [],
  };

  // Write each room inventory individually using the typed persistence API
  // (there is no bulk-set API in the typed module — T038 will revisit this)
  for (const [roomId, itemIds] of Object.entries(roomInventories)) {
    // Clear the room first by removing any existing items, then add each initial item.
    // We rely on addItemToRoom being idempotent for duplicates.
    const existing = persistence.getStoryRoomInventories()[roomId] ?? [];
    for (const id of existing) {
      persistence.removeItemFromRoom(roomId, id);
    }
    for (const id of itemIds) {
      persistence.addItemToRoom(roomId, id);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy storyCore shape
  (persistence as any).clearAllUnlockedDirections();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy storyCore shape
  (persistence as any).setAllUnlockedItems([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy storyCore shape
  (persistence as any).setStoryCompletionItemsCollected([]);

  persistence.setFlashlightStatus({
    isOn: false,
    batteryLevel: environmentValues.FLASHLIGHT_BATTERY_FULL,
  });
}

/**
 * Emit a debug summary of the current game state as an array of display lines.
 * Equivalent to storyCore.reportStoryData() — returns lines instead of console.log.
 */
export function reportGameState(): string[] {
  const currentRoom = _getCurrentRoom();
  const posX = persistence.getStoryPosX();
  const posY = persistence.getStoryPosY();
  const visited = persistence.getStoryVisitedRooms();
  const inventory = persistence.getStoryInventoryItems();
  const roomInventories = persistence.getStoryRoomInventories();
  const unlockedItems = persistence.getAllUnlockedItems();

  const roomInventoriesReport = Object.entries(roomInventories)
    .map(([roomId, inv]) => `{roomId: ${roomId}, inventory: [${inv.join(', ')}]}`)
    .join(', ');

  return [
    `RoomID: ${currentRoom?.id ?? '?'} (${posX}, ${posY}), XP: ${getXp()}, visited rooms: [${visited.join(', ')}], inventory: [${inventory.join(', ')}], room inventories: [${roomInventoriesReport}], unlocked items: [${unlockedItems.join(', ')}]`,
  ];
}

/**
 * Handle handing a completion item to the robot.
 * Equivalent to storyCore.handleCompletionEvent().
 */
export function handleCompletionEvent(itemId: number): string[] {
  // Remove item from user inventory
  persistence.removeStoryInventoryItem(itemId);

  // Store in completion list
  persistence.addStoryCompletionItemCollected(String(itemId));

  const givenItem = items.getItemById(itemId);
  const returnLines: string[] = [];
  let returnPhrase = '';

  switch (itemId) {
    case 13:
      // disk
      returnPhrase = `You give the robot the ${givenItem?.name ?? 'item'}. A narrow pyramid of green light twists from a beacon on the robot's shoulder, and briefly scans the plastic square. It throws the disk away, having quickly ingested the data within.`;
      break;

    case 18:
      // nav-card
      returnPhrase = `You hold the ${givenItem?.name ?? 'item'} up towards the robot. A long thin grasping arm emerges from the side of its body, and it gently plucks the ${givenItem?.name ?? 'item'} from your grasp. The arm and the ${givenItem?.name ?? 'item'} disappear into the machine, and a small door grinds closed behind them. You hear some quiet beeps.`;
      break;

    case 19:
      // hypercore
      returnPhrase = `You place the heavy ${givenItem?.name ?? 'item'} in front of you. The robot turns and though it has no face, you interperet its body language as a smile. It takes an earth shaking step towards you, and the ${givenItem?.name ?? 'item'} rises. It glows brighter than usual, and almost instantly absorbs like flaming mercury into the center of the robots core. The huge machine contracts briefly, then seems to exhale as its massive rectangular eye turns a bright orange, emitting a visible churn of plasma. You feel like you just typed IDDQD.`;
      break;

    default:
      returnPhrase = `You give the robot the ${givenItem?.name ?? 'item'}.`;
  }

  returnLines.push(returnPhrase);

  const completedList = persistence.getStoryCompletionItemsCollected();
  const fullList = environmentValues.COMPLETION_ITEM_IDS;
  if (completedList.length < fullList.length) {
    returnLines.push(_getRobotResponseUsed());
  } else {
    returnLines.push(_handleAllItemsGiven());
  }

  return returnLines;
}

/**
 * Calculate the player's current XP based on visited rooms, unlocked items,
 * unlocked exits, and completion items collected.
 * Equivalent to storyCore.getXp().
 */
export function getXp(): number {
  const visitedRoomXp =
    persistence.getStoryVisitedRooms().length * MagicNumbers.XP_PER_MOVE;
  const unlockedItemXp =
    persistence.getAllUnlockedItems().length * MagicNumbers.XP_PER_UNLOCK;
  const completionItemXp =
    persistence.getStoryCompletionItemsCollected().length * MagicNumbers.XP_PER_COMPLETION_ITEM;

  // Unlocked directions XP — persistence.ts does not expose getAllUnlockedExits as a named export.
  // Access via default export for backward compat; typed in T038 cleanup.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy storyCore shape; getAllUnlockedExits not yet in named exports
  const unlockedExits: unknown[] = (persistence as any).getAllUnlockedExits?.() ?? [];
  const unlockedDirectionXp = unlockedExits.length * MagicNumbers.XP_PER_UNLOCK;

  return visitedRoomXp + unlockedItemXp + completionItemXp + unlockedDirectionXp;
}

/**
 * Calculate the maximum possible XP in the game.
 * Equivalent to storyCore.getMaxXp().
 */
export function getMaxXp(): number {
  const exploreXp = rooms.rooms.length * MagicNumbers.XP_PER_MOVE;

  // Count active unlock XP — init with 1 fake unlock for robot's fake unlock
  let useXp = MagicNumbers.XP_PER_UNLOCK;
  items.items.forEach((currItem) => {
    if (currItem.use != null) {
      useXp += MagicNumbers.XP_PER_UNLOCK;
    }
  });

  const completionItemXp =
    environmentValues.COMPLETION_ITEM_IDS.length * MagicNumbers.XP_PER_COMPLETION_ITEM;

  return exploreXp + useXp + completionItemXp;
}

/**
 * Return true if this is a new / unstarted game.
 * Equivalent to storyCore.getIsNewStory().
 */
export function getIsNewGame(): boolean {
  const inventory = persistence.getStoryInventoryItems();
  if (inventory == null) return true;
  // undefined/true → is initial visit; false → has visited before
  return persistence.getStoryIsInitialVisit() !== false;
}

/**
 * Return true if all completion items have been collected.
 * Equivalent to storyCore._getIsGameCompleted() (promoted to public export).
 */
export function getIsGameCompleted(): boolean {
  return _getIsGameCompleted();
}

// --------------------------------------------------------------------------
// Death / respawn logic
// --------------------------------------------------------------------------

/**
 * Find which room currently contains the item with the given id.
 * Returns the roomId string, or null if the item is not in any room.
 */
function _findRoomThatContainsItem(itemId: number): string | null {
  const allRooms = persistence.getStoryRoomInventories();
  for (const [roomId, inventory] of Object.entries(allRooms)) {
    if (inventory.includes(itemId)) {
      return roomId;
    }
  }
  return null;
}

/**
 * Reset an item back to its original room if the player does not have it in
 * their inventory (used on death to redistribute dropped items).
 */
function _resetItemLocationOnDeath(itemResetObject: { roomId: number; itemId: number }): void {
  const userInventory = persistence.getStoryInventoryItems();
  if (userInventory.includes(itemResetObject.itemId)) {
    // Player still has it — nothing to reset
    return;
  }
  const currRoomLocationForItem = _findRoomThatContainsItem(itemResetObject.itemId);
  if (currRoomLocationForItem == null) {
    return;
  }
  persistence.removeItemFromRoom(currRoomLocationForItem, itemResetObject.itemId);
  persistence.addItemToRoom(String(itemResetObject.roomId), itemResetObject.itemId);
}

/**
 * Handle player death: increment death counter, reset special items, respawn.
 * Equivalent to storyCore.handleDeath().
 */
export function handleDeath(): void {
  // Increment deaths
  const currDeaths = persistence.getStoryDeaths();
  persistence.setStoryDeaths(currDeaths + 1);

  // Reset badge, helmet, translator if not in player inventory
  _resetItemLocationOnDeath(environmentValues.ROOM_RESET_BADGE);
  _resetItemLocationOnDeath(environmentValues.ROOM_RESET_HELMET);
  _resetItemLocationOnDeath(environmentValues.ROOM_RESET_TRANSLATOR);

  // Respawn at home coords
  persistence.setStoryPosX(environmentValues.RESPAWN_COORDS.x);
  persistence.setStoryPosY(environmentValues.RESPAWN_COORDS.y);
}
