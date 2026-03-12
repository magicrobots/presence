/**
 * roomNavigator.ts — Room navigation and description logic.
 *
 * Extracted from storyCore.js as part of the US3 decomposition.
 * Covers: current room lookup, room descriptions, exit descriptions,
 * exit-unlock checks, direction validation, and position changes.
 * All persistence I/O goes through persistence.ts named exports.
 */

import type { ExitDirection } from '../../types/game';
import rooms, { type StoryRoom, type RoomExit } from '../../constants/story-rooms';
import storyItems from '../../constants/story-items';
import environmentValues from '../../constants/environment-values';
import MagicNumbers from '../../constants/magic-numbers';
import * as persistence from '../persistence';

// --------------------------------------------------------------------------
// Internal helpers
// --------------------------------------------------------------------------

/**
 * Map a typed ExitDirection (lowercase: n/s/e/w) to the uppercase key
 * used as an index into StoryRoom.exits (N/E/W/S).
 */
function _toExitKey(direction: ExitDirection): 'N' | 'E' | 'W' | 'S' {
  // 'u' and 'd' (up/down) are not used in story-rooms — map them to null-safe fallback
  const map: Partial<Record<ExitDirection, 'N' | 'E' | 'W' | 'S'>> = {
    n: 'N',
    s: 'S',
    e: 'E',
    w: 'W',
  };
  return map[direction] ?? 'N';
}

/**
 * Resolve a variable text node to a plain string.
 * Variable text nodes may contain translation variants or dark-room variants.
 */
function _processVariableText(
  text: string | { unknown: string; translated: string } | { dark: string; illuminated: string } | null | undefined
): string {
  if (text == null) return '';

  if (typeof text === 'string') return text;

  if ('translated' in text) {
    // Check for translator item (id 12) in inventory
    if (persistence.getStoryInventoryItems().includes(12)) {
      return text.translated;
    }
    return text.unknown;
  }

  if ('dark' in text) {
    return _getUserCanSeeInTheDark() ? text.illuminated : text.dark;
  }

  return '';
}

/**
 * Return true if the player can see in dark rooms.
 * Requires flashlight in inventory, flashlight on, and battery > 0.
 */
function _getUserCanSeeInTheDark(): boolean {
  const lightStatus = persistence.getFlashlightStatus();
  if (lightStatus == null) return false;
  return (
    _hasFlashlight() &&
    lightStatus.isOn === true &&
    lightStatus.batteryLevel > 0
  );
}

/**
 * Return true if item 7 (flashlight) is in the player's inventory.
 */
function _hasFlashlight(): boolean {
  return persistence.getStoryInventoryItems().includes(7);
}

/**
 * Return true if the game has been completed (all completion items collected).
 */
function _getIsGameCompleted(): boolean {
  return (
    persistence.getStoryCompletionItemsCollected().length ===
    environmentValues.COMPLETION_ITEM_IDS.length
  );
}

/**
 * Get the processed room description string for the current room,
 * taking into account game completion state and variable text.
 */
function _getProcessedDescription(): string {
  const currentRoom = _getCurrentRoomInternal();
  if (currentRoom == null) return '';
  return _getIsGameCompleted()
    ? _processVariableText(currentRoom.completed)
    : _processVariableText(currentRoom.description);
}

/**
 * Get the processed room summary string (used for revisited rooms).
 */
function _getProcessedSummary(): string {
  const currentRoom = _getCurrentRoomInternal();
  if (currentRoom == null) return '';
  return _getIsGameCompleted()
    ? _processVariableText(currentRoom.completed)
    : `You are ${_processVariableText(currentRoom.summary)}.`;
}

/**
 * Internal: look up the current room using persisted position.
 */
function _getCurrentRoomInternal(): StoryRoom | undefined {
  const posX = persistence.getStoryPosX() || MagicNumbers.HOME_COORD_X;
  const posY = persistence.getStoryPosY() || MagicNumbers.HOME_COORD_Y;
  return rooms.getRoom({ x: posX, y: posY });
}

/**
 * Build item description text for items present in the current room.
 */
function _getItemDescriptions(): string {
  const currentRoom = _getCurrentRoomInternal();
  if (currentRoom == null) return '';

  const inventories = persistence.getStoryRoomInventories();
  const roomInventory = inventories[String(currentRoom.id)] ?? [];

  if (roomInventory.length === 0) return '';

  if (roomInventory.length > MagicNumbers.MAX_THINGS_TO_LIST) {
    return 'There is a bunch of stuff.';
  }

  const itemDescriptions = roomInventory
    .map((itemId) => storyItems.getItemById(itemId)?.description ?? '')
    .filter((desc) => desc.length > 0)
    .join(' ');

  return itemDescriptions;
}

/**
 * Get the room description only (without exits), and mark it as visited.
 */
function _getRoomDescriptionOnly(): string {
  const currentRoom = _getCurrentRoomInternal();
  if (currentRoom == null) return '';

  // Store room as visited
  persistence.addStoryVisitedRoom(String(currentRoom.id));

  let roomDesc = _getProcessedDescription();
  const itemDesc = _getItemDescriptions();
  if (itemDesc.length > 0) {
    roomDesc = `${roomDesc} ${itemDesc}`;
  }

  return roomDesc;
}

/**
 * Get the exit description for a single exit in a room.
 * Returns null if the exit does not exist.
 */
function _getExitDescription(roomId: number, exitKey: 'N' | 'E' | 'W' | 'S'): string | null {
  const room = rooms.getRoomById(roomId);
  if (room == null) return null;

  const exitObject: RoomExit | null = room.exits[exitKey];
  if (exitObject == null) return null;

  const isUnlocked = _getIsExitUnlockedInternal(room, exitKey);

  if (isUnlocked) {
    return _processVariableText(exitObject.opened);
  } else {
    return _processVariableText(exitObject.closed);
  }
}

/**
 * Internal: determine whether a specific exit in a room is unlocked.
 */
function _getIsExitUnlockedInternal(room: StoryRoom, exitKey: 'N' | 'E' | 'W' | 'S'): boolean {
  const exitObject: RoomExit | null = room.exits[exitKey];

  if (exitObject == null) return false;

  // If closed description is null, exit has no lock — it's always open
  if (exitObject.closed == null) {
    return true;
  }

  // Check if unlocked by using an item (e.g., access card)
  const isUnlockedByUse = persistence.getIsUnlockedDirectionFromRoom(String(room.id), exitKey);
  if (isUnlockedByUse) {
    return true;
  }

  // Check if unlocked by having a key item in inventory
  const inventory = persistence.getStoryInventoryItems();
  for (const currInventoryItemId of inventory) {
    const currItem = storyItems.getItemById(currInventoryItemId);
    if (currItem == null || currItem.isKey == null) continue;

    const isKey = currItem.isKey;

    if (Array.isArray(isKey)) {
      // isKey is an array of key objects
      for (const currKeyObject of isKey) {
        if (
          currKeyObject.room === room.id &&
          currKeyObject.direction === exitKey
        ) {
          return true;
        }
      }
    } else if (typeof isKey === 'object' && 'room' in isKey && 'direction' in isKey) {
      // isKey is a single { room, direction } key object
      const keyObj = isKey as { room: number; direction: string };
      if (keyObj.room === room.id && keyObj.direction === exitKey) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function _shuffleArray<T>(array: T[]): T[] {
  let counter = array.length;
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    const temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }
  return array;
}

/**
 * Handle flashlight battery drain per room entry.
 */
function _handleFlashlightBatteryDrain(): void {
  const lightStatus = persistence.getFlashlightStatus();
  if (lightStatus == null) return;

  if (lightStatus.isOn) {
    persistence.setFlashlightStatus({
      isOn: lightStatus.isOn,
      batteryLevel: lightStatus.batteryLevel - 1,
    });
  }
}

/**
 * Get the flashlight dying warning message for low battery levels.
 * Returns null if battery is not in the warning range.
 */
function _getFlashlightDyingMessage(): string | null {
  const lightStatus = persistence.getFlashlightStatus();
  if (lightStatus == null || !lightStatus.isOn) return null;

  switch (lightStatus.batteryLevel) {
    case 3:
      return 'The light coming from the flashlight appears to get dimmer. Might just be your imagination.';
    case 2:
      return "The flashlight flickers off. You smash the back of it with your hand and it comes back on, but now it's much dimmer.";
    case 1:
      return 'The flashlight blinks on and off. You shake it. The dim beam steadies as the batteries rattle inside.';
    case 0:
      return 'With an almost silent click, the flashlight goes off. Nothing you do can turn it back on.';
    default:
      return null;
  }
}

// --------------------------------------------------------------------------
// Public exports
// --------------------------------------------------------------------------

/**
 * Get the StoryRoom object for the player's current position.
 * Returns the room data as defined in story-rooms.ts.
 */
export function getCurrentRoom(): StoryRoom {
  const room = _getCurrentRoomInternal();
  if (room == null) {
    // Fallback to home room if position yields no room
    const homeRoom = rooms.getRoom({ x: MagicNumbers.HOME_COORD_X, y: MagicNumbers.HOME_COORD_Y });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- home room must exist
    return homeRoom!;
  }
  return room;
}

/**
 * Get the string ID of the player's current room.
 * Equivalent to storyCore.getCurrentRoomId().
 */
export function getCurrentRoomId(): string {
  return String(getCurrentRoom().id);
}

/**
 * Get the current room's display description (or trap/death response if applicable).
 * Handles dark-trap rooms, flashlight low-battery warnings, and first-visit vs revisit.
 * Equivalent to storyCore.getCurrentRoomDescription().
 */
export function getCurrentRoomDescription(): string[] {
  const currentRoom = getCurrentRoom();
  const isTrap = currentRoom.isDarkTrap === true || currentRoom.isAirlock === true;

  // If room is a trap and player can't see in the dark, trigger death
  if (isTrap && !_getUserCanSeeInTheDark()) {
    const trapResponse = _getProcessedDescription();
    // Increment deaths and respawn
    const currDeaths = persistence.getStoryDeaths();
    persistence.setStoryDeaths(currDeaths + 1);
    persistence.addStoryVisitedRoom(String(currentRoom.id));
    persistence.setStoryPosX(environmentValues.RESPAWN_COORDS.x);
    persistence.setStoryPosY(environmentValues.RESPAWN_COORDS.y);

    return [trapResponse];
  }

  const descriptionContent: string[] = [];

  // Warn if flashlight is low
  const lightStatus = persistence.getFlashlightStatus();
  if (
    lightStatus != null &&
    lightStatus.isOn &&
    lightStatus.batteryLevel >= 0 &&
    lightStatus.batteryLevel < 4
  ) {
    const dyingMessage = _getFlashlightDyingMessage();
    if (dyingMessage != null) {
      descriptionContent.push(dyingMessage);
      descriptionContent.push('');
    }
  }

  // First visit shows full description; revisit shows summary
  const roomIsNew = !persistence.getStoryVisitedRooms().includes(String(currentRoom.id));

  if (roomIsNew) {
    descriptionContent.push(...getFullRoomDescription());
  } else {
    descriptionContent.push(_getProcessedSummary());
  }

  return descriptionContent;
}

/**
 * Get the full room description: description text + blank line + exit descriptions.
 * Equivalent to storyCore.getFullRoomDescription().
 */
export function getFullRoomDescription(): string[] {
  const roomDesc = _getRoomDescriptionOnly();
  const fullDesc: string[] = [roomDesc, ''];
  fullDesc.push(getExitDescriptions());
  return fullDesc;
}

/**
 * Build a shuffled, single-string summary of all available exits.
 * Equivalent to storyCore.getExitDescriptions().
 */
export function getExitDescriptions(): string {
  const currentRoom = getCurrentRoom();
  const exitDescs: string[] = [];

  for (const possibility of environmentValues.exitPossibilities) {
    const exitKey = possibility.abbr as 'N' | 'E' | 'W' | 'S';
    const desc = _getExitDescription(currentRoom.id, exitKey);
    if (desc != null && desc.length > 0) {
      exitDescs.push(desc);
    }
  }

  return _shuffleArray(exitDescs).join(' ');
}

/**
 * Determine whether a given exit direction from the current room is unlocked.
 * Equivalent to storyCore.getIsExitUnlocked() but takes an ExitDirection.
 */
export function getIsExitUnlocked(direction: ExitDirection): boolean {
  const currentRoom = getCurrentRoom();
  const exitKey = _toExitKey(direction);
  return _getIsExitUnlockedInternal(currentRoom, exitKey);
}

/**
 * Type predicate: return true if the given string is a valid, accessible ExitDirection
 * from the current room.
 * Equivalent to storyCore.isValidDirection() but takes a lowercase direction string.
 */
export function isValidDirection(direction: string): direction is ExitDirection {
  if (direction == null) return false;

  const validDirections: ExitDirection[] = ['n', 's', 'e', 'w', 'u', 'd'];
  if (!validDirections.includes(direction as ExitDirection)) return false;

  const asDirection = direction as ExitDirection;
  const exitKey = _toExitKey(asDirection);
  const currentRoom = getCurrentRoom();

  // Only N/E/W/S exits exist in the story
  if (!['n', 's', 'e', 'w'].includes(direction)) return false;

  const exitObject: RoomExit | null = currentRoom.exits[exitKey];
  if (exitObject == null) return false;

  return _getIsExitUnlockedInternal(currentRoom, exitKey);
}

/**
 * Move the player in the given direction and return response lines.
 * Handles battery drain, room-not-found errors, and coordinate updates.
 * Equivalent to storyCore.handlePositionChange() but takes a typed direction
 * and returns response lines instead of mutating indirectly.
 */
export function handlePositionChange(direction: ExitDirection): string[] {
  const currentRoom = getCurrentRoom();

  // Find the exit possibility for this direction
  const possibility = environmentValues.exitPossibilities.find(
    (p) => p.abbr.toLowerCase() === direction
  );

  if (possibility == null) {
    return [`You can't go that way.`];
  }

  // Handle battery drain before moving
  _handleFlashlightBatteryDrain();

  // Compute new coordinates
  const changeAxis = possibility.coordModifier.direction; // 'X' or 'Y'
  const amount = possibility.coordModifier.amount;

  const nextX = changeAxis === 'X' ? currentRoom.x + amount : currentRoom.x;
  const nextY = changeAxis === 'Y' ? currentRoom.y + amount : currentRoom.y;

  const nextRoom = rooms.getRoom({ x: nextX, y: nextY });

  if (nextRoom == null) {
    // eslint-disable-next-line no-console -- developer warning for missing room data
    console.warn(
      `WARNING: user encountered room that doesn't exist. Developers need to create a room at {x:${nextX}, y:${nextY}}`
    );
    return [`That path leads nowhere.`];
  }

  // Store new position
  if (changeAxis === 'X') {
    persistence.setStoryPosX(nextX);
  } else {
    persistence.setStoryPosY(nextY);
  }

  return [];
}

/**
 * Return a "where am I" summary for the current room.
 * Equivalent to storyCore.whereAmI().
 */
export function whereAmI(): string[] {
  return [_getProcessedSummary()];
}

/**
 * Determine whether a given room is in space.
 * Takes a roomId string and looks up the room.
 * Equivalent to storyCore.getIsRoomInSpace() with an explicit roomId.
 */
export function getIsRoomInSpace(roomId: string): boolean {
  const id = parseInt(roomId, 10);
  const room = rooms.getRoomById(id);
  if (room == null) return false;
  return room.isInSpace === true;
}

/**
 * Return true if the current room is a dark trap or airlock.
 * Equivalent to storyCore.getIsRoomTrap().
 */
export function getIsRoomTrap(): boolean {
  const currentRoom = getCurrentRoom();
  return currentRoom.isDarkTrap === true || currentRoom.isAirlock === true;
}

/**
 * Return descriptive lines for what lies in a given direction from the current room.
 * If the exit exists, returns the exit description. Otherwise returns a "nothing of interest" message.
 * Equivalent to storyCore.getDescriptionInDirection().
 */
export function getDescriptionInDirection(direction: { abbr: string; word: string }): string[] {
  const currentRoom = getCurrentRoom();
  const exitKey = direction.abbr as 'N' | 'E' | 'W' | 'S';
  const exitObject: RoomExit | null = currentRoom.exits[exitKey];
  if (exitObject != null) {
    const desc = _getExitDescription(currentRoom.id, exitKey);
    if (desc != null) {
      return [desc];
    }
  }
  return [`There is nothing of interest to the ${direction.word.toLowerCase()}`];
}
