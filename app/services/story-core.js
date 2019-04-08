import Service from '@ember/service';
import { computed } from '@ember/object';
import { isPresent, isNone } from '@ember/utils';
import { inject as service } from '@ember/service';

import rooms from '../const/story-rooms';
import items from '../const/story-items';
import environmentValues from '../const/environment-values';

const XP_PER_MOVE = 1;
const XP_PER_UNLOCK = 2;
const XP_PER_COMPLETION_ITEM = 3;
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

    _processVariableText(text) {
        // if text is an object
        if (isPresent(text.translated)) {
            // check for posession of translator
            if (this.persistenceHandler.getStoryInventoryItems().includes(12)) {
                return text.translated;
            }
            return text.unknown;
        }

        // just return the plain string
        return text;
    },

    _findRoomThatContainsItem(itemId) {
        const allRooms = this.persistenceHandler.getStoryRoomInventories();
        for (let i = 0; i < allRooms.length; i++) {
            const currRoomRef = allRooms[i];
            if (currRoomRef.inventory.includes(itemId)) {
                return currRoomRef.roomId;
            }
        }

        return null;
    },

    // _shuffleArray stolen outright from https://jsfiddle.net/Jonathan_Ironman/hbtq58m4/

    _shuffleArray ( array ) {
        var counter = array.length, temp, index;
        // While there are elements in the array
        while ( counter > 0 ) {
            // Pick a random index
            index = Math.floor( Math.random() * counter );
    
            // Decrease counter by 1
            counter--;
    
            // And swap the last element with it
            temp = array[ counter ];
            array[ counter ] = array[ index ];
            array[ index ] = temp;
        }
        return array;
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

        const unlockedItems = this.persistenceHandler.getAllUnlockedItems();

        console.log(`RoomID: ${this.currentRoom.id} (${posX}, ${posY}), XP: ${xp}, visited rooms: [${visited}], inventory: [${inventory}], room inventories: [${roomInventoriesReport}], unlocked exits: [${unlockedExitsString}], unlocked items: [${unlockedItems}]`);
    },

    formatStoryData() {
        // TODO: find a better way to store init values for everything
        // initialize defaults / start over
        this.persistenceHandler.setStoryXP(0);
        this.persistenceHandler.setStoryDeaths(0);
        this.persistenceHandler.setStoryPosX(HOME_COORD_X);
        this.persistenceHandler.setStoryPosY(HOME_COORD_Y);
        this.persistenceHandler.setStoryVisitedRooms([]);
        this.persistenceHandler.setStoryInventoryItems([3]);
        this.persistenceHandler.setStoryRoomInventories([
            {roomId: 1, inventory: [1]},
            {roomId: 2, inventory: [2, 5]},
            {roomId: 3, inventory: [4]},
            {roomId: 4, inventory: [6]},
            {roomId: 5, inventory: [7, 8]},
            {roomId: 6, inventory: []},
            {roomId: 7, inventory: []},
            {roomId: 8, inventory: []},
            {roomId: 9, inventory: [9]},
            {roomId: 10, inventory: [10]},
            {roomId: 11, inventory: []},
            {roomId: 12, inventory: []},
            {roomId: 13, inventory: []},
            {roomId: 14, inventory: []},
            {roomId: 15, inventory: [11]},
            {roomId: 16, inventory: [13, 15]},
            {roomId: 17, inventory: []},
            {roomId: 18, inventory: []},
            {roomId: 19, inventory: [14]},
            {roomId: 20, inventory: []},
            {roomId: 21, inventory: [16]},
            {roomId: 22, inventory: []},
            {roomId: 23, inventory: []},
            {roomId: 24, inventory: []},
            {roomId: 25, inventory: [19]},
            {roomId: 26, inventory: [18, 17]},
            {roomId: 27, inventory: []}
        ]);
        this.persistenceHandler.clearAllUnlockedDirections();
        this.persistenceHandler.setAllUnlockedItems([]);
        this.persistenceHandler.setStoryCompletionItemsCollected([]);
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

    getNextRoomInfo(enteredDirection) {
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

        return {nextRoom,
            nextX,
            nextY,
            newCoord,
            positionFunctionNameSet};
    },

    handlePositionChange(nextRoomInfo) {

        // warn if room is under construction
        if (isNone(nextRoomInfo.nextRoom)) {
            console.log(`WARNING: user encountered room that doesn't exist.  Developers needs to create a room at {x:${nextRoomInfo.nextX}, y:${nextRoomInfo.nextY}}`);
            return false;
        }

        // reward user for exploring
        const nextRoomIsNew = !this.persistenceHandler.getStoryVisitedRooms().includes(nextRoomInfo.nextRoom.id);
        if (nextRoomIsNew) {
            this._increaseXP(XP_PER_MOVE);
        }

        // store that user has gone to the next room
        this.persistenceHandler[nextRoomInfo.positionFunctionNameSet](nextRoomInfo.newCoord);
    },

    getIsRoomTrap() {
        if (isNone(this.currentRoom.exits[environmentValues.DIRECTION_N()]) &&
            isNone(this.currentRoom.exits[environmentValues.DIRECTION_E()]) &&
            isNone(this.currentRoom.exits[environmentValues.DIRECTION_W()]) &&
            isNone(this.currentRoom.exits[environmentValues.DIRECTION_S()])) {
            return true;
        }

        return false;
    },

    handleTrap() {
        const trapDescription = this.currentRoom.description;
        this.handleDeath();

        return [trapDescription];
    },

    handleDeath() {
        // increment deaths
        const currDeaths = this.persistenceHandler.getStoryDeaths();
        this.persistenceHandler.setStoryDeaths(currDeaths + 1);

        // reset helmet and badge if they aren't in inventory
        const badgeId = environmentValues.ROOM_RESET_BADGE.itemId;
        const helmetId = environmentValues.ROOM_RESET_HELMET.itemId;
        if (!this.persistenceHandler.getStoryInventoryItems().includes(badgeId)) {
            this.persistenceHandler.removeItemFromRoom(this._findRoomThatContainsItem(badgeId), badgeId);
            this.persistenceHandler.addItemToRoom(environmentValues.ROOM_RESET_BADGE.roomId, badgeId);
        }
        if (!this.persistenceHandler.getStoryInventoryItems().includes(helmetId)) {
            this.persistenceHandler.removeItemFromRoom(this._findRoomThatContainsItem(helmetId), helmetId);
            this.persistenceHandler.addItemToRoom(environmentValues.ROOM_RESET_HELMET.roomId, helmetId);
        }

        // respawn
        this.persistenceHandler.setStoryPosX(environmentValues.RESPAWN_COORDS.x);
        this.persistenceHandler.setStoryPosY(environmentValues.RESPAWN_COORDS.y);        
    },

    handleRobotAttack() {
        this.handleDeath();

        return ['The massive being doesn\'t even realize you\'re there. Something that looks like a wingless mosquito the size of a horse attacks the robot and as it turns in defense, it knocks you off the helipad and you fall to your death.'];
    },

    getCurrentRoomDescription() {
        // are you dead?
        if (this.getIsRoomTrap()) {
            return this.handleTrap();
        }

        // have you been here before?
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

    getIsRoomInSpace(roomOverride) {
        const testRoom = isPresent(roomOverride) ? roomOverride : this.currentRoom;

        return isPresent(testRoom.isInSpace) && testRoom.isInSpace === true;
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
        const exitDescs = [];
        const scope = this;
        environmentValues.exitPossibilities.forEach((currPossibility) => {
            const currExitDescription = this.getExitDescription(scope.currentRoom.id, currPossibility.abbr);
            if(isPresent(currExitDescription)) {
                exitDescs.push(`${this._processVariableText(currExitDescription)}`);
            }
        });

        return this._shuffleArray(exitDescs).join(' ');
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
                // either unlocked by using item
                const isUnlockedByUse = this.persistenceHandler.getIsUnlockedDirectionFromRoom(room.id, exitOrientation);
                if (isUnlockedByUse) {
                    return true;
                }

                // or is unlocked by having key in inventory
                const inventory = this.persistenceHandler.getStoryInventoryItems();
                let hasKey = false;
                inventory.forEach((currInventoryItemId) => {
                    const currItem = items.getItemById(currInventoryItemId);
                    if (isPresent(currItem.isKey)) {
                        if (isPresent(currItem.isKey.room)) {
                            if (currItem.isKey.room === room.id &&
                                currItem.isKey.direction === exitOrientation) {
                                hasKey = true;
                            }
                        } else if (isPresent(currItem.isKey.length)) {
                            currItem.isKey.forEach((currKeyObject) => {
                                if (currKeyObject.room === room.id &&
                                    currKeyObject.direction === exitOrientation) {
                                    hasKey = true;
                                }
                            });
                        }
                    }
                });

                return hasKey;
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

        return targetItem.weight + this.getWeightOfUserInventory() < environmentValues.WEIGHT_CAPACITY;
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

        // if it's a useable item, return details based on whether or not it's used
        let isUsed = false;
        if (isPresent(item.use)) {
            // if it's a document check used items for item id
            if (item.type === environmentValues.ITEM_TYPE_DOC) {
                const unlockedItems = this.persistenceHandler.getAllUnlockedItems();
                if (unlockedItems.includes(item.use.unlocks.item)) {
                    isUsed = true;
                }
            } else {
                // if it's a thing check unlocked rooms for use unlock room id
                if (this.persistenceHandler.getIsUnlockedDirectionFromRoom(item.use.unlocks.room, item.use.unlocks.direction) ) {
                    isUsed = true;
                }
            }
        }

        const detailsResponse = isUsed ? item.detailsUsed : item.details;

        return isPresent(item) ? detailsResponse : null;
    },

    getItemTypeById(searchId) {
        const item = items.getItemById(searchId);

        return isPresent(item) ? item.type : null;
    },

    readDocument(targetItemId) {
        const currDoc = items.getItemById(targetItemId);

        if (isPresent(currDoc.use)) {
            const unlockItemId = currDoc.use.unlocks.item;
            const isNewDoc = !this.persistenceHandler.getAllUnlockedItems().includes(unlockItemId);
            if (isNewDoc) {
                // increase XP
                this._increaseXP(XP_PER_UNLOCK);

                // store unlock
                this.persistenceHandler.unlockItem(unlockItemId);

                // user feedback
                return [currDoc.use.response.first];
            } else {
                // user feedback
                return [currDoc.use.response.subsequent];
            }
        }

        return [`You can't read ${currDoc.name}`];
    },

    getItemIsLocked(item) {
        const lockList = [];
        const passiveKeyItems = [];
        const passiveKeyIds = [];
        items.items.forEach((currItem) => {
            // list of things unlocked by using an item
            if (currItem.type === environmentValues.ITEM_TYPE_DOC) {
                if (isPresent(currItem.use)) {
                    if (isPresent(currItem.use.unlocks)) {
                        if (isPresent(currItem.use.unlocks.item)) {
                            lockList.push(currItem.use.unlocks.item);
                        }
                    }
                }
            } else {
                // list of things unlocked by having an item in your inventory
                if (currItem.type === environmentValues.ITEM_TYPE_THING) {
                    if (isPresent(currItem.isKey)) {
                        if (isPresent(currItem.isKey.item)) {
                            passiveKeyIds.push(currItem.isKey.item);
                            passiveKeyItems.push(currItem);
                        }
                    }
                }
            }
        });

        const isLockable = lockList.includes(item.id) || passiveKeyIds.includes(item.id);

        if (isLockable) {
            const isUnlocked = this.persistenceHandler.getAllUnlockedItems().includes(item.id);
            if (isUnlocked) {
                return false;
            }

            // check if item is unlocked passively by having a key item
            const userInventory = this.persistenceHandler.getStoryInventoryItems();
            let isUnlockedPassively = false;

            passiveKeyItems.forEach((currPassiveKeyItem) => {
                if (userInventory.includes(currPassiveKeyItem.id) &&
                    currPassiveKeyItem.isKey.item === item.id) {
                    isUnlockedPassively = true;
                }
            });

            return !isUnlockedPassively;
        }

        return false;
    },

    useItem(targetItemId) {
        const item = items.getItemById(targetItemId);

        // reject usage of locked item
        if (this.getItemIsLocked(item)) {

            // if it's the robot it kills you.
            if (item.id === 10) {
                return this.handleRobotAttack();
            }

            return [`You can't figure out how to use the ${item.name}. You feel like you're missing something.`];
        }

        if (isPresent(item.use)) {
            // increase XP if they haven't done this before
            const isNewUnlock = !this.persistenceHandler.getIsUnlockedDirectionFromRoom(item.use.unlocks.room, item.use.unlocks.direction);
            if (isNewUnlock) {
                this._increaseXP(XP_PER_UNLOCK);

                // store unlock change
                this.persistenceHandler.setIsUnlockedDirectionInRoom(item.use.unlocks.room, item.use.unlocks.direction);

                // handle special events
                if (item.id === 10) {
                    // robot drops translator in helipad
                    this.persistenceHandler.addItemToRoom(10, 12);
                    // force unlock robot so he doesn't kill you
                    this.persistenceHandler.unlockItem(10);
                }

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

        // add active unlock xp
        items.items.forEach((currItem) => {
            if (isPresent(currItem.use)) {
                useXp += XP_PER_UNLOCK;
            }
        });

        // add completion item delivery xp
        const completionItemXp = environmentValues.COMPLETION_ITEM_IDS.length * XP_PER_COMPLETION_ITEM;

        return roomXp +
            useXp +
            completionItemXp;
    },

    handleCompletionEvent(completionItemId) {
        // increase XP
        this._increaseXP(XP_PER_COMPLETION_ITEM);

        // remove item from user inventory
        this.persistenceHandler.removeStoryInventoryItem(completionItemId);

        // store item in robot inventory
        this.persistenceHandler.addStoryCompletionItemCollected(completionItemId);
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