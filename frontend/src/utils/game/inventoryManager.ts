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
/**
 * Get an item name by its numeric id.
 * Returns the item's name, or null if not found.
 * Equivalent to storyCore.getItemNameById().
 */
export function getItemNameById(id: number): string | null {
  const item = storyItems.getItemById(id);
  return item != null ? item.name : null;
}

/**
 * Get an item id by its name.
 * Returns the item's id, or null if not found.
 * Equivalent to storyCore.getItemIdByName().
 */
export function getItemIdByName(name: string): number | null {
  const item = storyItems.getItemByName(name);
  return item != null ? item.id : null;
}

/**
 * Get an item's type by its numeric id.
 * Returns the item's type string, or null if not found.
 * Equivalent to storyCore.getItemTypeById().
 */
export function getItemTypeById(id: number): string | null {
  const item = storyItems.getItemById(id);
  return item != null ? item.type : null;
}

/**
 * Get detailed description for an item, taking into account whether it has been used.
 * Equivalent to storyCore.getItemDetailsById().
 */
export function getItemDetailsById(searchId: number): string | null {
  const item = storyItems.getItemById(searchId);
  if (item == null) return null;

  let isUsed = false;
  if (item.use != null) {
    if (item.type === environmentValues.ITEM_TYPE_DOC) {
      const unlockedItems = persistence.getAllUnlockedItems();
      if (item.use.unlocks?.item != null && unlockedItems.includes(item.use.unlocks.item)) {
        isUsed = true;
      }
    } else {
      if (
        item.use.unlocks?.room != null &&
        item.use.unlocks?.direction != null &&
        persistence.getIsUnlockedDirectionFromRoom(
          String(item.use.unlocks.room),
          item.use.unlocks.direction
        )
      ) {
        isUsed = true;
      }
    }
  }

  const detailsResponse = isUsed ? item.detailsUsed : item.details;
  return detailsResponse ?? null;
}

/**
 * Remove an item from both the specified room and the player's inventory.
 * Convenience for "consuming" an item from the world.
 */
function _removeItemFromWorld(roomId: string, itemId: number): void {
  persistence.removeItemFromRoom(roomId, itemId);
  persistence.removeStoryInventoryItem(itemId);
}

/**
 * Feed ducks (or geese/fish) in room 2.
 * Consumes the sandwich (id 2) or pretzel (id 22) from the player's inventory.
 * Equivalent to storyCore.feedDucks().
 */
export function feedDucks(currentRoomId: string): string[] {
  const hasPretzel = persistence.getStoryInventoryItems().includes(22);
  const hasSandwich = persistence.getStoryInventoryItems().includes(2);
  const hasBread = hasPretzel || hasSandwich;

  if (hasBread) {
    const activeBreadId = hasSandwich ? 2 : 22;
    const activeBread = storyItems.getItemById(activeBreadId);
    const activeBreadName = activeBread?.name ?? 'food';
    _removeItemFromWorld(currentRoomId, activeBreadId);
    return [
      `You take bits of the ${activeBreadName} and toss them in the water. Some little fishies come and nibble at them, and dart away when the ducks and geese paddle over and scoop them from the pond surface. It's soothing.`,
      '',
      `The ${activeBreadName} grows smaller and smaller and eventually is gone completely as you pluck pieces away for your new feathered friends.`,
    ];
  }
  return ['If only you had some bread.'];
}

/**
 * Feed the robot (item 9 — wrench) in room 10.
 * Consumes the wrench from the player's inventory.
 * Equivalent to storyCore.feedRobot().
 */
export function feedRobot(currentRoomId: string): string[] {
  if (persistence.getStoryInventoryItems().includes(9)) {
    _removeItemFromWorld(currentRoomId, 9);
    return [
      'The wrench is really heavy so you need both hands to hold it out and waggle it like a giant metal cheeto. "Hungry? Want a yummy wrench?" you say, feeling kind of idiotic.',
      '',
      "The robot focuses on you for a moment. It almost makes a gesture like it's chuckling. A small door opens on on its side and a long spider like grasping appendage unfolds from within, and it lifts the wrench from your hands like it was nothing. It pulls it inside itself and you hear a muffled grinding noise.",
      '',
      "A scanning laser appears for a moment next to you on the floor of the helipad, connecting the machine's massive rectangular eye and the ground for a split second. Smoke wisps up from the mark burned into the metal, which looks like a square with an X inscribed within.",
    ];
  }
  return ['What do you think a giant robot would like as a snack?'];
}

/**
 * Feed aliens in room 13 or 27. Triggers death.
 * Equivalent to storyCore.feedAliens().
 */
export function feedAliens(onDeath: () => void): string[] {
  onDeath();
  return [
    'You make kissy noises trying to attract whatever you can\'t see as if it were a cute puppy.',
    '',
    '"Hey out there! Want a snack?" - you pat your pockets looking for a candy bar or something. You hear something shuffling in the dark. You reach out and turn off the light wondering if it\'s scared.',
    '',
    'The moment you click the light off, you hear a hiss and scrambling claws and before you can click the light back on or defend yourself you are eaten by an alien. You have succesfully fed the aliens.',
  ];
}

/**
 * Attack an alien in room 13 or 27. Triggers death.
 * Equivalent to storyCore.attackAlien().
 */
export function attackAlien(onDeath: () => void): string[] {
  onDeath();
  return [
    "Making do with what you've got you figure you can take this thing. It doesn't sound that big.",
    '',
    "You steel your nerves and try to go on the offensive. Each time you lunge forward, or creep towards it, or run full speed at it, you find it has agility far greater than your own. You still haven't even seen what it looks like. You are starting to wonder if it's all in your head and there isn't even anything there. You shut off the light to see if that will lure it closer.",
    '',
    'The thing comes at you as fast as the darkness does. You barely have time to react as you are gruesomely eaten by the alien. Sorry it didn\'t work out.',
  ];
}

/**
 * Handle robot attack — triggers death and returns response lines.
 * Equivalent to storyCore.handleRobotAttack().
 */
export function handleRobotAttack(onDeath: () => void): string[] {
  onDeath();
  return [
    'The massive being considers you for a moment. All of a sudden, something that looks like a wingless mosquito the size of a horse attacks the robot and as it turns in defense, it knocks you off the helipad and you fall to your death.',
  ];
}

/**
 * Eat a food item from inventory. Removes it from the world.
 * Equivalent to storyCore.eatObject().
 */
export function eatObject(currentRoomId: string, targetItemId: number): string[] {
  const currFood = storyItems.getItemById(targetItemId);
  _removeItemFromWorld(currentRoomId, targetItemId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- onEat is not yet in StoryItem type
  return [(currFood as any)?.onEat ?? ''];
}

/**
 * Drink a drink item from inventory. Removes it from the world.
 * Equivalent to storyCore.drinkObject().
 */
export function drinkObject(currentRoomId: string, targetItemId: number): string[] {
  const currDrink = storyItems.getItemById(targetItemId);
  _removeItemFromWorld(currentRoomId, targetItemId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- onDrink is not yet in StoryItem type
  return [(currDrink as any)?.onDrink ?? ''];
}

/**
 * Drink poison — removes it, triggers death, returns response.
 * Equivalent to storyCore.drinkPoison().
 */
export function drinkPoison(currentRoomId: string, targetItemId: number, onDeath: () => void): string[] {
  const currDrink = storyItems.getItemById(targetItemId);
  _removeItemFromWorld(currentRoomId, targetItemId);
  onDeath();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- onDrink is not yet in StoryItem type
  return [(currDrink as any)?.onDrink ?? ''];
}

/**
 * Eat the cake (item 11). Only works in space. Removes it from the world.
 * Equivalent to storyCore.eatCake().
 */
export function eatCake(currentRoomId: string): string[] {
  _removeItemFromWorld(currentRoomId, 11);
  persistence.setCakeEaten(true);
  return [
    "You lift the glass cover off the pedestal. You throw it on the floor, excited about finally taking a moment to yourself to eat some cake. The cover bounces with a high pitched TANG! You grasp the perfect slice of cake in one hand, gently supporting the narrow end with your pinky. You stare down your snack.",
    '',
    "It is beautiful. You have a litte frosting on your thumb. It smells of fresh melted butter and rich milk chocolate. You close your eyes and take a bite. This cake is not a lie. It is delicious and perfect and you decide that every decision you ever made, every path you've ever taken has been purposeful, to lead you to this very moment. God damn this is some good cake.",
  ];
}

/**
 * Read a document item and return response lines.
 * If the document has a use-unlock, marks it as unlocked on first read.
 * Equivalent to storyCore.readDocument().
 */
export function readDocument(targetItemId: number): string[] {
  const currDoc = storyItems.getItemById(targetItemId);
  if (currDoc == null) return ['Item not found.'];

  if (currDoc.use != null && currDoc.use.unlocks?.item != null) {
    const unlockItemId = currDoc.use.unlocks.item;
    const isNewDoc = !persistence.getAllUnlockedItems().includes(unlockItemId);
    if (isNewDoc) {
      persistence.unlockItem(unlockItemId);
      return [currDoc.use.response.first];
    } else {
      return [currDoc.use.response.subsequent];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- content not yet in StoryItem type
  return [`The ${currDoc.name} says:`, ''].concat((currDoc as any).content ?? []);
}

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
