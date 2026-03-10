const KEY_MAGIC_ROBOTS_DATA = 'magic-robots-data';

// app level
const KEY_USERNAME = 'username';
const KEY_FONT_SIZE = 'font-size';
const KEY_SHOW_KEYBOARD = 'show-keyboard';
const KEY_GRAPHICS_MODE = 'graphics-mode';

// fling
const KEY_FLING_RECORD = 'fling-record';

// story level
const KEY_STORY_POS_X = 'story-pos-x';
const KEY_STORY_POS_Y = 'story-pos-y';
const KEY_STORY_VISITED_ROOMS = 'story-visited-rooms';
const KEY_STORY_INVENTORY_ITEMS = 'story-inventory-items';
const KEY_STORY_ROOM_INVENTORIES = 'story-room-inventories';
const KEY_STORY_ROOM_UNLOCKED_DIRECTIONS = 'story-room-unlocked-directions';
const KEY_STORY_UNLOCKED_ITEMS = 'story-unlocked-items';
const KEY_STORY_DEATH_COUNTER = 'story-death-counter';
const KEY_STORY_COMPLETION_ITEMS = 'story-completion-items';
const KEY_FLASHLIGHT_STATUS = 'story-flashlight-status';
const KEY_CAKE_STATUS = 'story-cake-status';
const KEY_STORY_IS_INITIAL_VISIT = 'story-is-initial-visit';

function _validateBoolean(value) {
    return ['true', '1', 'yes'].includes(value);
}

function _getStorageObject() {
    const dataAsString = window.localStorage.getItem(KEY_MAGIC_ROBOTS_DATA);

    return dataAsString != null ? JSON.parse(dataAsString) : {};
}

let magicRobotsData = _getStorageObject();

function _setStorageObject() {
    const dataAsString = JSON.stringify(magicRobotsData);
    window.localStorage.setItem(KEY_MAGIC_ROBOTS_DATA, dataAsString);
}

// --------------------- app vars ------------------------

function setUsername(newName) {
    magicRobotsData[KEY_USERNAME] = newName;
    _setStorageObject();
}

function getUsername() {
    return _getStorageObject()[KEY_USERNAME] || 'guest';
}

function setFontSize(size) {
    // validate size entry
    const validEntries = ['l', 'm', 's'];
    if (validEntries.includes(size)) {
        magicRobotsData[KEY_FONT_SIZE] = size;
        _setStorageObject();
    }
}

function getFontSize() {
    return _getStorageObject()[KEY_FONT_SIZE];
}

function setShowKeyboard(isShowKeyboard) {
    if (_validateBoolean(isShowKeyboard)) {
        magicRobotsData[KEY_SHOW_KEYBOARD] = isShowKeyboard;
        _setStorageObject();
    }
}

function getShowKeyboard() {
    return _getStorageObject()[KEY_SHOW_KEYBOARD];
}

function setGraphicsMode(mode) {
    if (['hi', 'lo'].includes(mode)) {
        magicRobotsData[KEY_GRAPHICS_MODE] = mode;
        _setStorageObject();
    }
}

function getGraphicsMode() {
    return _getStorageObject()[KEY_GRAPHICS_MODE];
}

// --------------------- fling game vars ------------------------

function setFlingRecord(newRecord) {
    magicRobotsData[KEY_FLING_RECORD] = newRecord;
    _setStorageObject();
}

function getFlingRecord() {
    return _getStorageObject()[KEY_FLING_RECORD];
}

// --------------------- story vars ------------------------

function setStoryPosX(newX) {
    magicRobotsData[KEY_STORY_POS_X] = newX;
    _setStorageObject();
}

function getStoryPosX() {
    return _getStorageObject()[KEY_STORY_POS_X];
}

function setStoryPosY(newY) {
    magicRobotsData[KEY_STORY_POS_Y] = newY;
    _setStorageObject();
}

function getStoryPosY() {
    return _getStorageObject()[KEY_STORY_POS_Y];
}

function setStoryDeaths(newDeaths) {
    magicRobotsData[KEY_STORY_DEATH_COUNTER] = newDeaths;
    _setStorageObject();
}

function getStoryDeaths() {
    return _getStorageObject()[KEY_STORY_DEATH_COUNTER];
}

function addStoryVisitedRoom(newRoom) {
    let currRooms = getStoryVisitedRooms();
    if (currRooms != null) {
        if (!currRooms.includes(newRoom)) {
            currRooms.push(newRoom);
        }
    } else {
        currRooms = [newRoom];
    }

    // set updated value
    setStoryVisitedRooms(currRooms);
}

function setStoryVisitedRooms(newRooms) {
    magicRobotsData[KEY_STORY_VISITED_ROOMS] = newRooms;
    _setStorageObject();
}

function getStoryVisitedRooms() {
    return _getStorageObject()[KEY_STORY_VISITED_ROOMS];
}

function addStoryInventoryItem(newItem) {
    let currItems = getStoryInventoryItems();
    if (currItems != null) {
        if (!currItems.includes(newItem)) {
            currItems.push(newItem);
        }
    } else {
        currItems = [newItem];
    }

    // set updated value
    setStoryInventoryItems(currItems);
}

function removeItemFromWorld(roomId, itemId) {
    // remove from inventory
    removeStoryInventoryItem(itemId);
    // remove from room
    removeItemFromRoom(roomId, itemId);
}

function removeStoryInventoryItem(dropItem) {
    let currItems = getStoryInventoryItems();
    if (currItems != null) {
        if (currItems.includes(dropItem)) {
            const itemsLessDroppedItem = currItems.filter((currItem) => {
                return currItem !== dropItem;
            });

            // write new set minus dropped item
            setStoryInventoryItems(itemsLessDroppedItem);
        }
    }
}

function setStoryInventoryItems(newItems) {
    magicRobotsData[KEY_STORY_INVENTORY_ITEMS] = newItems;
    _setStorageObject();
}

function getStoryInventoryItems() {
    return _getStorageObject()[KEY_STORY_INVENTORY_ITEMS];
}

function setStoryRoomInventories(newInventories) {
    magicRobotsData[KEY_STORY_ROOM_INVENTORIES] = newInventories;
    _setStorageObject();
}

function getStoryRoomInventories() {
    return _getStorageObject()[KEY_STORY_ROOM_INVENTORIES];
}

function getStoryRoomInventoryById(targetRoomId) {
    const currRoomInventories = getStoryRoomInventories();
    const targetRoomObject = currRoomInventories.find(r => r.roomId === targetRoomId);

    return targetRoomObject.inventory;
}

function addItemToRoom(targetRoomId, item) {
    const currRoomInventories = getStoryRoomInventories();
    const currRoomObject = currRoomInventories.find(r => r.roomId === targetRoomId);
    currRoomObject.inventory.push(item);

    // store modified set
    setStoryRoomInventories(currRoomInventories);
}

function removeItemFromRoom(targetRoomId, item) {
    const currRoomInventories = getStoryRoomInventories();
    let currRoomObject = currRoomInventories.find(r => r.roomId === targetRoomId);
    currRoomObject.inventory = currRoomObject.inventory.filter((currItem) => {
        return currItem !== item;
    });

    // store modified set
    setStoryRoomInventories(currRoomInventories);
}

function clearAllUnlockedDirections() {
    magicRobotsData[KEY_STORY_ROOM_UNLOCKED_DIRECTIONS] = [];
    _setStorageObject();
}

function getAllUnlockedExits() {
    return _getStorageObject()[KEY_STORY_ROOM_UNLOCKED_DIRECTIONS];
}

function setIsUnlockedDirectionInRoom(roomId, direction) {
    const unlockedPairs = getAllUnlockedExits();
    let currRoomObject = unlockedPairs.find(r => r.roomId === roomId);

    if (currRoomObject != null) {
        currRoomObject.unlocked.push(direction);
    } else {
        currRoomObject = {
            roomId: roomId,
            unlocked: [direction]
        };
        unlockedPairs.push(currRoomObject);
    }

    magicRobotsData[KEY_STORY_ROOM_UNLOCKED_DIRECTIONS] = unlockedPairs;
    _setStorageObject();
}

function getIsUnlockedDirectionFromRoom(roomId, direction) {
    const unlockedPairs = getAllUnlockedExits();
    let currRoomObject = unlockedPairs.find(r => r.roomId === roomId);

    if (currRoomObject != null) {
        if (currRoomObject.unlocked.includes(direction)) {
            return true;
        }
    }

    return false;
}

function setAllUnlockedItems(newItems) {
    magicRobotsData[KEY_STORY_UNLOCKED_ITEMS] = newItems;
    _setStorageObject();
}

function getAllUnlockedItems() {
    return _getStorageObject()[KEY_STORY_UNLOCKED_ITEMS];
}

function unlockItem(itemId) {
    let currUnlockedItems = getAllUnlockedItems();
    if (currUnlockedItems != null) {
        if (!currUnlockedItems.includes(itemId)) {
            currUnlockedItems.push(itemId);
        }
    } else {
        currUnlockedItems = [itemId];
    }

    // set updated value
    setAllUnlockedItems(currUnlockedItems);
}

function addStoryCompletionItemCollected(newItem) {
    let currItems = getStoryCompletionItemsCollected();
    if (currItems != null) {
        if (!currItems.includes(newItem)) {
            currItems.push(newItem);
        }
    } else {
        currItems = [newItem];
    }

    // set updated value
    setStoryCompletionItemsCollected(currItems);
}

function setStoryCompletionItemsCollected(newItems) {
    magicRobotsData[KEY_STORY_COMPLETION_ITEMS] = newItems;
    _setStorageObject();
}

function getStoryCompletionItemsCollected() {
    return _getStorageObject()[KEY_STORY_COMPLETION_ITEMS];
}

function setFlashlightStatus(newFlashlightStatus) {
    magicRobotsData[KEY_FLASHLIGHT_STATUS] = newFlashlightStatus;
    _setStorageObject();
}

function getFlashlightStatus() {
    return _getStorageObject()[KEY_FLASHLIGHT_STATUS];
}

function setCakeEaten(newCakeStatus) {
    magicRobotsData[KEY_CAKE_STATUS] = newCakeStatus;
    _setStorageObject();
}

function getCakeEaten() {
    return _getStorageObject()[KEY_CAKE_STATUS];
}

function setIsInitialVisit(value) {
    magicRobotsData[KEY_STORY_IS_INITIAL_VISIT] = value;
    _setStorageObject();
}

function getIsInitialVisit() {
    return _getStorageObject()[KEY_STORY_IS_INITIAL_VISIT];
}

export default {
    setUsername,
    getUsername,
    setFontSize,
    getFontSize,
    setShowKeyboard,
    getShowKeyboard,
    setGraphicsMode,
    getGraphicsMode,
    setFlingRecord,
    getFlingRecord,
    setStoryPosX,
    getStoryPosX,
    setStoryPosY,
    getStoryPosY,
    setStoryDeaths,
    getStoryDeaths,
    addStoryVisitedRoom,
    setStoryVisitedRooms,
    getStoryVisitedRooms,
    addStoryInventoryItem,
    removeItemFromWorld,
    removeStoryInventoryItem,
    setStoryInventoryItems,
    getStoryInventoryItems,
    setStoryRoomInventories,
    getStoryRoomInventories,
    getStoryRoomInventoryById,
    addItemToRoom,
    removeItemFromRoom,
    clearAllUnlockedDirections,
    getAllUnlockedExits,
    setIsUnlockedDirectionInRoom,
    getIsUnlockedDirectionFromRoom,
    setAllUnlockedItems,
    getAllUnlockedItems,
    unlockItem,
    addStoryCompletionItemCollected,
    setStoryCompletionItemsCollected,
    getStoryCompletionItemsCollected,
    setFlashlightStatus,
    getFlashlightStatus,
    setCakeEaten,
    getCakeEaten,
    setIsInitialVisit,
    getIsInitialVisit
};
