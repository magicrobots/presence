import Service from '@ember/service';
import { set, get } from '@ember/object';
import { isPresent } from '@ember/utils';

const KEY_MAGIC_ROBOTS_DATA = 'magic-robots-data';

// app level
const KEY_USERNAME = 'username';
const KEY_PROMPT_COLOR = 'prompt-color';

// game level
const KEY_GAME_POS_X = 'game-pos-x';
const KEY_GAME_POS_Y = 'game-pos-y';
const KEY_GAME_XP = 'game-xp';

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

    // --------------------- game vars ------------------------
    
    setGamePosX(newX) {
        set(this, `magicRobotsData.${KEY_GAME_POS_X}`, newX);
        this._setStorageObject();
    },

    getGamePosX() {
        return get(this._getStorageObject(), KEY_GAME_POS_X);
    },
    
    setGamePosY(newY) {
        set(this, `magicRobotsData.${KEY_GAME_POS_Y}`, newY);
        this._setStorageObject();
    },

    getGamePosY() {
        return get(this._getStorageObject(), KEY_GAME_POS_Y);
    },
    
    setGameXP(newXP) {
        set(this, `magicRobotsData.${KEY_GAME_XP}`, newXP);
        this._setStorageObject();
    },

    getGameXP() {
        return get(this._getStorageObject(), KEY_GAME_XP);
    }
});