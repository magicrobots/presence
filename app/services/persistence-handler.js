import Service from '@ember/service';
import { set, get } from '@ember/object';
import { isPresent } from '@ember/utils';

const KEY_MAGIC_ROBOTS_DATA = 'magic-robots-data';

// app level
const KEY_USERNAME = 'username';
const KEY_PROMPT_COLOR = 'prompt-color';

// story level
const KEY_STORY_POS_X = 'story-pos-x';
const KEY_STORY_POS_Y = 'story-pos-y';
const KEY_STORY_XP = 'story-xp';
const KEY_STORY_VISITED_ROOMS = 'story-visited-rooms';
const KEY_STORY_INVENTORY_ITEMS = 'story-inventory-items';
const KEY_STORY_ROOM_INVENTORIES = 'story-room-inventories';
const KEY_STORY_ROOM_UNLOCKED_DIRECTIONS = 'story-room-unlocked-directions';
const KEY_STORY_UNLOCKED_ITEMS = 'story-unlocked-items';
const KEY_STORY_DEATH_COUNTER = 'story-death-counter';
const KEY_STORY_COMPLETION_ITEMS = 'story-completion-items';

export default Service.extend({
    init() {
        this._super(...arguments);

        // initialize appData object
        set(this, 'magicRobotsData', this._getStorageObject());
    },

    _getStorageObject() {
        const dataAsString = window.localStorage.getItem(KEY_MAGIC_ROBOTS_DATA);

        return isPresent(dataAsString) ? JSON.parse(dataAsString) : {};
    },

    _setStorageObject() {
        const dataAsString = JSON.stringify(this.magicRobotsData);
        window.localStorage.setItem(KEY_MAGIC_ROBOTS_DATA, dataAsString);
    },

    // --------------------- app vars ------------------------
    
    setUsername(newName) {
        set(this, `magicRobotsData.${KEY_USERNAME}`, newName);
        this._setStorageObject();
    },

    getUsername() {
        return get(this._getStorageObject(), KEY_USERNAME) || 'unknown user';
    },
    
    setPromptColor(newColor) {
        set(this, `magicRobotsData.${KEY_PROMPT_COLOR}`, newColor);
        this._setStorageObject();
    },

    getPromptColor() {
        return get(this._getStorageObject(), KEY_PROMPT_COLOR);
    },

    // --------------------- story vars ------------------------
    
    setStoryPosX(newX) {
        set(this, `magicRobotsData.${KEY_STORY_POS_X}`, newX);
        this._setStorageObject();
    },

    getStoryPosX() {
        return get(this._getStorageObject(), KEY_STORY_POS_X);
    },
    
    setStoryPosY(newY) {
        set(this, `magicRobotsData.${KEY_STORY_POS_Y}`, newY);
        this._setStorageObject();
    },

    getStoryPosY() {
        return get(this._getStorageObject(), KEY_STORY_POS_Y);
    },
    
    setStoryXP(newXP) {
        set(this, `magicRobotsData.${KEY_STORY_XP}`, newXP);
        this._setStorageObject();
    },

    getStoryXP() {
        return get(this._getStorageObject(), KEY_STORY_XP);
    },
    
    setStoryDeaths(newDeaths) {
        set(this, `magicRobotsData.${KEY_STORY_DEATH_COUNTER}`, newDeaths);
        this._setStorageObject();
    },

    getStoryDeaths() {
        return get(this._getStorageObject(), KEY_STORY_DEATH_COUNTER);
    },
    
    addStoryVisitedRoom(newRoom) {
        let currRooms = this.getStoryVisitedRooms();
        if (isPresent(currRooms)) {
            if (!currRooms.includes(newRoom)) {
                currRooms.push(newRoom);
            }
        } else {
            currRooms = [newRoom];
        }

        // set updated value
        this.setStoryVisitedRooms(currRooms);
    },
    
    setStoryVisitedRooms(newRooms) {
        set(this, `magicRobotsData.${KEY_STORY_VISITED_ROOMS}`, newRooms);
        this._setStorageObject();
    },

    getStoryVisitedRooms() {
        return get(this._getStorageObject(), KEY_STORY_VISITED_ROOMS);
    },
    
    addStoryInventoryItem(newItem) {
        let currItems = this.getStoryInventoryItems();
        if (isPresent(currItems)) {
            if (!currItems.includes(newItem)) {
                currItems.push(newItem);
            }
        } else {
            currItems = [newItem];
        }

        // set updated value
        this.setStoryInventoryItems(currItems);
    },

    removeStoryInventoryItem(dropItem) {
        let currItems = this.getStoryInventoryItems();
        if (isPresent(currItems)) {
            if (currItems.includes(dropItem)) {
                const itemsLessDroppedItem = currItems.filter((currItem) => {
                    return currItem !== dropItem;
                });

                // write new set minus dropped item
                this.setStoryInventoryItems(itemsLessDroppedItem);
            }
        }
    },
    
    setStoryInventoryItems(newItems) {
        set(this, `magicRobotsData.${KEY_STORY_INVENTORY_ITEMS}`, newItems);
        this._setStorageObject();
    },

    getStoryInventoryItems() {
        return get(this._getStorageObject(), KEY_STORY_INVENTORY_ITEMS);
    },

    setStoryRoomInventories(newInventories) {
        set(this, `magicRobotsData.${KEY_STORY_ROOM_INVENTORIES}`, newInventories);
        this._setStorageObject();
    },

    getStoryRoomInventories() {
        return get(this._getStorageObject(), KEY_STORY_ROOM_INVENTORIES);
    },

    getStoryRoomInventoryById(targetRoomId) {
        const currRoomInventories = this.getStoryRoomInventories();
        const targetRoomObject = currRoomInventories.findBy('roomId', targetRoomId);

        return targetRoomObject.inventory;
    },

    addItemToRoom(targetRoomId, item) {
        const currRoomInventories = this.getStoryRoomInventories();
        const currRoomObject = currRoomInventories.findBy('roomId', targetRoomId);
        currRoomObject.inventory.push(item);

        // store modified set
        this.setStoryRoomInventories(currRoomInventories);
    },

    removeItemFromRoom(targetRoomId, item) {
        const currRoomInventories = this.getStoryRoomInventories();
        let currRoomObject = currRoomInventories.findBy('roomId', targetRoomId);
        currRoomObject.inventory = currRoomObject.inventory.filter((currItem) => {
            return currItem !== item;
        });

        // store modified set
        this.setStoryRoomInventories(currRoomInventories);
    },

    clearAllUnlockedDirections() {
        set(this, `magicRobotsData.${KEY_STORY_ROOM_UNLOCKED_DIRECTIONS}`, []);
        this._setStorageObject();
    },

    getAllUnlockedExits() {
        return get(this._getStorageObject(), KEY_STORY_ROOM_UNLOCKED_DIRECTIONS);
    },

    setIsUnlockedDirectionInRoom(roomId, direction) {
        const unlockedPairs = this.getAllUnlockedExits();
        let currRoomObject = unlockedPairs.findBy('roomId', roomId);

        if (isPresent(currRoomObject)) {
            currRoomObject.unlocked.push(direction);
        } else {
            currRoomObject = {
                roomId: roomId,
                unlocked: [direction]
            };
            unlockedPairs.push(currRoomObject);
        }

        set(this, `magicRobotsData.${KEY_STORY_ROOM_UNLOCKED_DIRECTIONS}`, unlockedPairs);
        this._setStorageObject();
    },

    getIsUnlockedDirectionFromRoom(roomId, direction) {
        const unlockedPairs = this.getAllUnlockedExits();
        let currRoomObject = unlockedPairs.findBy('roomId', roomId);

        if (isPresent(currRoomObject)) {
            if(currRoomObject.unlocked.includes(direction)) {
                return true;
            }
        }

        return false;
    },

    setAllUnlockedItems(newItems) {
        set(this, `magicRobotsData.${KEY_STORY_UNLOCKED_ITEMS}`, newItems);
        this._setStorageObject();
    },

    getAllUnlockedItems() {
        return get(this._getStorageObject(), KEY_STORY_UNLOCKED_ITEMS);
    },

    unlockItem(itemId) {
        let currUnlockedItems = this.getAllUnlockedItems();
        if (isPresent(currUnlockedItems)) {
            if (!currUnlockedItems.includes(itemId)) {
                currUnlockedItems.push(itemId);
            }
        } else {
            currUnlockedItems = [itemId];
        }

        // set updated value
        this.setAllUnlockedItems(currUnlockedItems);
    },
    
    addStoryCompletionItemCollected(newItem) {
        let currItems = this.getStoryCompletionItemsCollected();
        if (isPresent(currItems)) {
            if (!currItems.includes(newItem)) {
                currItems.push(newItem);
            }
        } else {
            currItems = [newItem];
        }

        // set updated value
        this.setStoryCompletionItemsCollected(currItems);
    },
    
    setStoryCompletionItemsCollected(newItems) {
        set(this, `magicRobotsData.${KEY_STORY_COMPLETION_ITEMS}`, newItems);
        this._setStorageObject();
    },

    getStoryCompletionItemsCollected() {
        return get(this._getStorageObject(), KEY_STORY_COMPLETION_ITEMS);
    }
});