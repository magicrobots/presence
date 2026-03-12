/**
 * inventoryManager.ts — Inventory query and item-use logic.
 *
 * Extracted from storyCore.js as part of the US3 decomposition.
 * Covers: item lookup, weight calculation, canTake check, room inventory,
 * lock detection, and item-use execution.
 * All persistence I/O goes through persistence.ts named exports.
 */

import type { RoomInventory } from '../../types/game';
import storyItems, { type StoryItem } from '../../constants/story-items';
import environmentValues from '../../constants/environment-values';
import * as persistence from '../persistence';

// --------------------------------------------------------------------------
// Private helpers
// --------------------------------------------------------------------------

function _getItemIsLockedInternal(item: StoryItem): boolean {
  const lockList: number[] = [];
  const passiveKeyItems: StoryItem[] = [];
  const passiveKeyIds: number[] = [];

  storyItems.items.forEach((currItem) => {
    // list of things unlocked by using a document item
    if (currItem.type === environmentValues.ITEM_TYPE_DOC) {
      if (currItem.use != null) {
        if (currItem.use.unlocks != null) {
          if (currItem.use.unlocks.item != null) {
            lockList.push(currItem.use.unlocks.item);
          }
        }
      }
    } else {
      // list of things unlocked by having an item in inventory (passive key)
      if (currItem.type === environmentValues.ITEM_TYPE_THING) {
        if (currItem.isKey != null && !Array.isArray(currItem.isKey)) {
          if ('item' in currItem.isKey && currItem.isKey.item != null) {
            passiveKeyIds.push(currItem.isKey.item);
            passiveKeyItems.push(currItem);
          }
        }
      }
    }
  });

  const isLockable = lockList.includes(item.id) || passiveKeyIds.includes(item.id);

  if (isLockable) {
    const isUnlocked = persistence.getAllUnlockedItems().includes(item.id);
    if (isUnlocked) {
      return false;
    }

    // check if item is passively unlocked by having a key item in inventory
    const userInventory = persistence.getStoryInventoryItems();
    let isUnlockedPassively = false;

    passiveKeyItems.forEach((currPassiveKeyItem) => {
      if (
        currPassiveKeyItem.isKey != null &&
        !Array.isArray(currPassiveKeyItem.isKey) &&
        'item' in currPassiveKeyItem.isKey
      ) {
        if (
          userInventory.includes(currPassiveKeyItem.id) &&
          currPassiveKeyItem.isKey.item === item.id
        ) {
          isUnlockedPassively = true;
        }
      }
    });

    return !isUnlockedPassively;
  }

  return false;
}

function _handleRobotAttack(): string[] {
  // increment deaths
  const currDeaths = persistence.getStoryDeaths();
  persistence.setStoryDeaths(currDeaths + 1);

  return [
    'The massive being considers you for a moment. All of a sudden, something that looks like a wingless mosquito the size of a horse attacks the robot and as it turns in defense, it knocks you off the helipad and you fall to your death.',
  ];
}

function _processVariableItemDescription(description: string): string {
  if (description === environmentValues.ROBOT_RESPONSE_USED) {
    const remainingIds = environmentValues.COMPLETION_ITEM_IDS.filter(
      (x) => !persistence.getStoryCompletionItemsCollected().includes(String(x))
    );
    const remainingNames = remainingIds.map((currId) => {
      const item = storyItems.getItemById(currId);
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
  return description;
}

// --------------------------------------------------------------------------
// Public exports
// --------------------------------------------------------------------------

/**
 * Look up a story item by its numeric id.
 * Returns undefined if no item with that id exists.
 */
export function getItemById(id: number): StoryItem | undefined {
  return storyItems.getItemById(id);
}

/**
 * Look up a story item by its name string.
 * Returns undefined if no item with that name exists.
 */
export function getItemByName(name: string): StoryItem | undefined {
  return storyItems.getItemByName(name);
}

/**
 * Calculate the total weight of all items in the player's inventory.
 * Equivalent to storyCore.getWeightOfUserInventory().
 */
export function getWeightOfUserInventory(): number {
  const userInventory = persistence.getStoryInventoryItems();
  let totalWeight = 0;
  userInventory.forEach((currItemId) => {
    const currItem = storyItems.getItemById(currItemId);
    if (currItem != null) {
      totalWeight += currItem.weight;
    }
  });
  return totalWeight;
}

/**
 * Determine whether the player can pick up an item given their current inventory weight.
 * Returns { allowed: true } if the item can be taken, or { allowed: false, reason } otherwise.
 * Equivalent to storyCore.canTakeItem() with an added reason string.
 */
export function canTakeItem(itemId: number): { allowed: boolean; reason?: string } {
  const targetItem = storyItems.getItemById(itemId);
  if (targetItem == null) {
    return { allowed: false, reason: 'Item not found.' };
  }
  const fits = targetItem.weight + getWeightOfUserInventory() <= environmentValues.WEIGHT_CAPACITY;
  if (!fits) {
    return {
      allowed: false,
      reason: "You can't carry any more. You are too heavily loaded.",
    };
  }
  return { allowed: true };
}

/**
 * Get the inventory for a given room.
 * Returns a RoomInventory with the room's current item ids.
 * Equivalent to storyCore.getRoomInventory() but takes an explicit roomId.
 */
export function getRoomInventory(roomId: string): RoomInventory {
  const inventories = persistence.getStoryRoomInventories();
  const itemIds = inventories[roomId] ?? [];
  return { roomId, itemIds };
}

/**
 * Determine whether an item is currently locked (cannot be used).
 * An item is locked if it requires a document read or passive key that has not yet been satisfied.
 * Equivalent to storyCore.getItemIsLocked() but takes a numeric id instead of an item object.
 */
export function getItemIsLocked(itemId: number): boolean {
  const item = storyItems.getItemById(itemId);
  if (item == null) return false;
  return _getItemIsLockedInternal(item);
}

/**
 * Use an item and return an array of response lines.
 * Handles: death-trap items (controls #17), locked items, document unlock,
 * direction unlock, and robot special events.
 * Note: flashlight toggling (item #7) is excluded from this module — callers that
 * need flashlight behaviour should invoke flashlightManager.useFlashlight() directly.
 * Equivalent to storyCore.useItem() minus the flashlight case.
 */
export function useItem(itemId: number): string[] {
  const item = storyItems.getItemById(itemId);
  if (item == null) {
    return ['That item does not exist.'];
  }

  // Flying the spaceship controls kills you
  if (item.id === 17) {
    const currDeaths = persistence.getStoryDeaths();
    persistence.setStoryDeaths(currDeaths + 1);
    return [
      'You grab the levers as if you were an actual pilot. You move them around and push some buttons, seeing if anything happens. You are slammed against the back wall as the ship accelerates into the vastness of space. After a few days of hurtling through the nothingness, you die of dehydration somewhere out by UDF 2457.',
    ];
  }

  // Flashlight is handled by flashlightManager — delegate message to caller
  if (item.id === 7) {
    return ['Use the flashlight command to operate the flashlight.'];
  }

  // Reject usage of locked item
  if (_getItemIsLockedInternal(item)) {
    // If it's the robot it kills you
    if (item.id === 10) {
      return _handleRobotAttack();
    }
    return [`You can't figure out how to use the ${item.name}. You feel like you're missing something.`];
  }

  if (item.use != null) {
    const unlocks = item.use.unlocks;

    if (item.type === environmentValues.ITEM_TYPE_DOC) {
      // Document: unlock an item
      const unlockItemId = unlocks.item;
      if (unlockItemId != null) {
        const isNewDoc = !persistence.getAllUnlockedItems().includes(unlockItemId);
        if (isNewDoc) {
          persistence.unlockItem(unlockItemId);
          return [item.use.response.first];
        } else {
          return [item.use.response.subsequent];
        }
      }
    } else {
      // Non-document: unlock a direction in a room
      const unlockRoom = unlocks.room;
      const unlockDirection = unlocks.direction;
      if (unlockRoom != null && unlockDirection != null) {
        const isNewUnlock = !persistence.getIsUnlockedDirectionFromRoom(
          String(unlockRoom),
          unlockDirection
        );
        if (isNewUnlock) {
          // Store the unlock
          persistence.setIsUnlockedDirectionInRoom(String(unlockRoom), unlockDirection);

          // Handle special events
          if (item.id === 10) {
            // Robot drops translator in helipad (room 10)
            persistence.addItemToRoom('10', 12);
            // Force-unlock robot so it doesn't kill you next time
            persistence.unlockItem(10);
          }

          return [item.use.response.first];
        }

        return [_processVariableItemDescription(item.use.response.subsequent)];
      }
    }
  }

  return [`${item.name} is not a useable item.`];
}
