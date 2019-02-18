import Service from '@ember/service';
import { computed } from '@ember/object';
import { isPresent, isNone } from '@ember/utils';
import { inject as service } from '@ember/service';

import rooms from '../const/story-rooms';
import items from '../const/story-items';

const XP_PER_MOVE = 1;
const WEIGHT_CAPACITY = 50;
const HOME_COORD_X = 47;
const HOME_COORD_Y = 47;
const EXIT_POSSIBILITIES = [
        {abbr:'N', word: 'NORTH', coordModifier: {direction: 'Y', amount: -1}},
        {abbr:'E', word: 'EAST', coordModifier: {direction: 'X', amount: 1}},
        {abbr:'W', word: 'WEST', coordModifier: {direction: 'X', amount: -1}},
        {abbr:'S', word: 'SOUTH', coordModifier: {direction: 'Y', amount: 1}}
    ];

export default Service.extend({
    persistenceHandler: service(),
    
    // ------------------- private methods -------------------

    _increaseXP(amount) {
        const oldXP = this.persistenceHandler.getStoryXP();
        const newXP = oldXP + amount;
        this.persistenceHandler.setStoryXP(newXP);
    },

    // ------------------- computed properties -------------------

    currentRoom: computed('persistenceHandler.magicRobotsData.{story-pos-x,story-pos-y}', {
        get() {
            const posX = this.persistenceHandler.getStoryPosX() || HOME_COORD_X;
            const posY = this.persistenceHandler.getStoryPosY() || HOME_COORD_Y;

            return rooms.getRoom({x: posX, y: posY});
        }
    }),

    // ------------------- public methods -------------------

    reportStoryData() {
        const posX = this.persistenceHandler.getStoryPosX();
        const posY = this.persistenceHandler.getStoryPosY();
        const xp = this.persistenceHandler.getStoryXP();
        const visited = this.persistenceHandler.getStoryVisitedRooms();
        const inventory = this.persistenceHandler.getStoryInventoryItems();

        console.log(`Position: (${posX}, ${posY}), XP: ${xp}, visited rooms: [${visited}], inventory: ${inventory}`);
    },

    formatStoryData() {
        // start over
        this.persistenceHandler.setStoryXP(0);
        this.persistenceHandler.setStoryPosX(HOME_COORD_X);
        this.persistenceHandler.setStoryPosY(HOME_COORD_Y);
        this.persistenceHandler.setStoryVisitedRooms([]);
        this.persistenceHandler.setStoryInventoryItems([3]);
    },

    isValidDirection(enteredDirection) {
        if (isPresent(this.currentRoom.exits[enteredDirection.abbr])) {
            return true;
        }

        return false;
    },

    handlePositionChange(enteredDirection) {
        const changeAxis = enteredDirection.coordModifier.direction;
        const positionFunctionNameGet = `getStoryPos${changeAxis}`;
        const positionFunctionNameSet = `setStoryPos${changeAxis}`;
        // const defaultCoord = enteredDirection.coordModifier.direction === 'X' ? HOME_COORD_X : HOME_COORD_Y;
        const currentCoordValue = this.persistenceHandler[positionFunctionNameGet]();// || defaultCoord;
        const newCoord = currentCoordValue + enteredDirection.coordModifier.amount;

        // add XP if you're going to a new location.
        const nextX = changeAxis === 'X' ?
            this.currentRoom.x + enteredDirection.coordModifier.amount :
            this.currentRoom.x;
        const nextY = changeAxis === 'Y' ?
            this.currentRoom.y + enteredDirection.coordModifier.amount :
            this.currentRoom.y;
        const nextRoom = rooms.getRoom({x:nextX, y:nextY});

        if (isNone(nextRoom)) {
            console.log(`WARNING: user encountered room that doesn't exist.  Developers needs to create a room at {x:${nextX}, y:${nextY}}`);
            return false;
        }

        const nextRoomIsNew = !this.persistenceHandler.getStoryVisitedRooms().includes(nextRoom.id);
        if (nextRoomIsNew) {
            this._increaseXP(XP_PER_MOVE);
        }

        // go
        this.persistenceHandler[positionFunctionNameSet](newCoord);
    },

    getCurrentRoomDescription() {
        const roomIsNew = !this.persistenceHandler.getStoryVisitedRooms().includes(this.currentRoom.id);

        if (roomIsNew) {
            return this.getFullRoomDescription();
        } else {
            return [`You are ${this.currentRoom.summary}.`];
        }
    },

    getDescriptionInDirection(lookDirection) {
        const exitInDirection = this.currentRoom.exits[lookDirection.abbr];
        if (isPresent(exitInDirection)) {
            return [exitInDirection];
        } else {
            return [`There is nothing of interest to the ${lookDirection.word.toLowerCase()}`];
        }
    },

    getExitDescriptions() {
        let exitDescs = '';
        const scope = this;
        EXIT_POSSIBILITIES.forEach((currPossibility) => {
            const currExitPossibility = scope.currentRoom.exits[currPossibility.abbr];
            if(isPresent(currExitPossibility)) {
                exitDescs = exitDescs.concat(`${currExitPossibility} `);
            }
        });

        return exitDescs;
    },

    getFullRoomDescription() {
        let roomDesc = this.currentRoom.description;

        // store room as visited
        this.persistenceHandler.addStoryVisitedRoom(this.currentRoom.id);

        // add any present items to paragraph
        roomDesc = roomDesc.concat(` ${this._getItemDescriptions()}`);

        // add empty line
        const fullDesc = [roomDesc].concat(['']);

        // add exits
        fullDesc.push(this.getExitDescriptions());

        return fullDesc;
    },

    getWeightOfUserInventory() {
        const userInventory = this.persistenceHandler.getStoryInventoryItems();
        let totalWeight = 0;

        userInventory.forEach((currItemId) => {
            const currItemWeight = items.getItemById(currItemId).weight;
            totalWeight += currItemWeight;
        });

        return totalWeight;
    },

    canTakeItem(targetItemId) {
        const targetItem = items.getItemById(targetItemId);

        return targetItem.weight + this.getWeightOfUserInventory() < WEIGHT_CAPACITY;
    },

    getRoomInventory() {
        return this.currentRoom.inventory;
    },

    getItemNameById(searchId) {
        const item = items.getItemById(searchId);

        return isPresent(item) ? item.name : null;
    },

    getItemIdByName(itemName) {
        const item = items.getItemByName(itemName);

        return isPresent(item) ? item.id : null;
    },

    getItemDetailsById(searchId) {
        const item = items.getItemById(searchId);

        return isPresent(item) ? item.details : null;
    },
    
    getExitPossibilities() {
        return EXIT_POSSIBILITIES;
    },

    // ------------------- private methods -------------------

    _getItemDescriptions() {
        if (this.currentRoom.inventory.length > 0) {
            if (this.currentRoom.inventory.length > 1) {
                // too many things to show descriptions

                return 'There is stuff.';
            } else {
                // there's just one thing
                const roomInventoryItemId = this.currentRoom.inventory[0];
                const item = items.getItemById(roomInventoryItemId);

                return item.description;
            }
        }

        return '';
    }
});