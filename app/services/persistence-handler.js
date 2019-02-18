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
        return get(this._getStorageObject(), KEY_USERNAME);
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
    
    setStoryInventoryItems(newItems) {
        set(this, `magicRobotsData.${KEY_STORY_INVENTORY_ITEMS}`, newItems);
        this._setStorageObject();
    },

    getStoryInventoryItems() {
        return get(this._getStorageObject(), KEY_STORY_INVENTORY_ITEMS);
    }
});