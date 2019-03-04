import Service from '@ember/service';
import { computed } from '@ember/object';
import { isPresent, isNone } from '@ember/utils';
import { inject as service } from '@ember/service';

import rooms from '../const/story-rooms';
import items from '../const/story-items';
import environmentValues from '../const/environment-values';

const XP_PER_MOVE = 1;
const XP_PER_UNLOCK = 2;
const WEIGHT_CAPACITY = 50;
const HOME_COORD_X = 47;
const HOME_COORD_Y = 47;
const MAX_THINGS_TO_LIST = 10;

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

        // handle room inventories
        const roomInventories = this.persistenceHandler.getStoryRoomInventories();
        let roomInventoriesReport = '';
        roomInventories.forEach((currRoom, i, roomInventories) => {
            const roomString = `{roomId: ${currRoom.roomId}, inventory: [${currRoom.inventory}]}`;
            roomInventoriesReport = roomInventoriesReport.concat(roomString);

            // add commas and separators
            if (i < roomInventories.length - 1) {
                roomInventoriesReport = roomInventoriesReport.concat(', ');
            }
        });

        const unlockedExits = this.persistenceHandler.getAllUnlockedExits();
        let unlockedExitsString = '';
        unlockedExits.forEach((currRoom, i, unlockedExits) => {
            const roomString = `{roomId: ${currRoom.roomId}, unlocked: [${currRoom.unlocked}]}`;
            unlockedExitsString = unlockedExitsString.concat(roomString);

            // add commas and separators
            if (i < unlockedExits.length - 1) {
                unlockedExitsString = unlockedExitsString.concat(', ');
            }
        });

        console.log(`RoomID: ${this.currentRoom.id} (${posX}, ${posY}), XP: ${xp}, visited rooms: [${visited}], inventory: [${inventory}], room inventories: [${roomInventoriesReport}], unlocked exits: [${unlockedExitsString}]`);
    },

    formatStoryData() {
        // TODO: find a better way to store init values for everything
        // initialize defaults / start over
        this.persistenceHandler.setStoryXP(0);
        this.persistenceHandler.setStoryPosX(HOME_COORD_X);
        this.persistenceHandler.setStoryPosY(HOME_COORD_Y);
        this.persistenceHandler.setStoryVisitedRooms([]);
        this.persistenceHandler.setStoryInventoryItems([3]);
        this.persistenceHandler.setStoryRoomInventories([
            {roomId: 1, inventory: [1]},
            {roomId: 2, inventory: [2]},
            {roomId: 3, inventory: [4]}
        ]);
        this.persistenceHandler.clearAllUnlockedDirections();
    },

    isValidDirection(enteredDirection) {

        if (isNone(enteredDirection)) {
            return false;
        }

        if (isPresent(this.currentRoom.exits[enteredDirection.abbr])) {
            return this.getIsExitUnlocked(this.currentRoom, enteredDirection.abbr);
        }

        return false;
    },

    handlePositionChange(enteredDirection) {
        const changeAxis = enteredDirection.coordModifier.direction;
        const positionFunctionNameGet = `getStoryPos${changeAxis}`;
        const positionFunctionNameSet = `setStoryPos${changeAxis}`;
        const currentCoordValue = this.persistenceHandler[positionFunctionNameGet]();
        const newCoord = currentCoordValue + enteredDirection.coordModifier.amount;

        // get coordinates in movement direction, find destination room
        const nextX = changeAxis === 'X' ?
            this.currentRoom.x + enteredDirection.coordModifier.amount :
            this.currentRoom.x;
        const nextY = changeAxis === 'Y' ?
            this.currentRoom.y + enteredDirection.coordModifier.amount :
            this.currentRoom.y;
        const nextRoom = rooms.getRoom({x:nextX, y:nextY});

        // warn if room is under construction
        if (isNone(nextRoom)) {
            console.log(`WARNING: user encountered room that doesn't exist.  Developers needs to create a room at {x:${nextX}, y:${nextY}}`);
            return false;
        }

        // reward user for exploring
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

    getCurrentRoomId() {
        return this.currentRoom.id;
    },

    getDescriptionInDirection(lookDirection) {
        const exitInDirection = this.currentRoom.exits[lookDirection.abbr];
        if (isPresent(exitInDirection)) {
            return [this.getExitDescription(this.currentRoom.id, lookDirection.abbr)];
        } else {
            return [`There is nothing of interest to the ${lookDirection.word.toLowerCase()}`];
        }
    },

    getExitDescriptions() {
        let exitDescs = '';
        const scope = this;
        environmentValues.exitPossibilities.forEach((currPossibility) => {
            const currExitDescription = this.getExitDescription(scope.currentRoom.id, currPossibility.abbr);
            if(isPresent(currExitDescription)) {
                exitDescs = exitDescs.concat(`${currExitDescription} `);
            }
        });

        return exitDescs;
    },

    getExitDescription(roomId, exitOrientation) {
        const room = rooms.getRoomById(roomId);
        const exitObject = room.exits[exitOrientation];

        if (isPresent(exitObject)) {
            if (this.getIsExitUnlocked(room, exitOrientation)) {
                return exitObject.opened;
            } else {
                return exitObject.closed;
            }
        }

        return null;
    },

    getIsExitUnlocked(room, exitOrientation) {
        const targetOrientation = room.exits[exitOrientation];

        if(isPresent(targetOrientation)) {
            if(isPresent(targetOrientation.closed)) {
                return this.persistenceHandler.getIsUnlockedDirectionFromRoom(room.id, exitOrientation);
            }

            return true;
        }

        return false;
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
        return this.persistenceHandler.getStoryRoomInventoryById(this.currentRoom.id);
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

    getItemTypeById(searchId) {
        const item = items.getItemById(searchId);

        return isPresent(item) ? item.type : null;
    },

    readDocument(targetItemId) {
        const currDoc = items.getItemById(targetItemId);

        return [currDoc.use.response.first];
    },

    useItem(targetItemId) {
        const item = items.getItemById(targetItemId);

        if (isPresent(item.use)) {
            // increase XP if they haven't done this before
            const isNewUnlock = !this.persistenceHandler.getIsUnlockedDirectionFromRoom(item.use.unlocks.room, item.use.unlocks.direction);
            if (isNewUnlock) {
                this._increaseXP(XP_PER_UNLOCK);

                // store unlock change
                this.persistenceHandler.setIsUnlockedDirectionInRoom(item.use.unlocks.room, item.use.unlocks.direction);

                // user feedback
                return [item.use.response.first];
            }

            // tell user something happened
            return [item.use.response.subsequent];
        }

        return [`${item.name} is not a useable item.`];
    },

    getMaxPossibleXp() {
        // minus 1 here because initial room gives zero XP
        const roomXp = (rooms.rooms.length - 1) * XP_PER_MOVE;
        let useXp = 0;

        items.items.forEach((currItem) => {
            if (isPresent(currItem.use)) {
                useXp += XP_PER_UNLOCK;
            }
        });

        return roomXp + useXp;
    },

    // ------------------- private methods -------------------

    _getItemDescriptions() {
        const roomInventory = this.getRoomInventory();
        
        if (roomInventory.length > 0) {
            if (roomInventory.length > MAX_THINGS_TO_LIST) {
                // too many things to show descriptions

                return 'There is a bunch of stuff.';
            } else {
                let itemDescriptions = '';
                roomInventory.forEach((currItem, i, roomInventory) => {
                    const item = items.getItemById(currItem);
                    itemDescriptions = itemDescriptions.concat(item.description);

                    // add space if it's not that last one
                    if (i < roomInventory.length - 1) {
                        itemDescriptions = itemDescriptions.concat(' ');
                    }
                });

                return itemDescriptions;
            }
        }

        return '';
    }
});