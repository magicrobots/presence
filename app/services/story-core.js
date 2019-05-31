import Service from '@ember/service';
import { computed } from '@ember/object';
import { isPresent, isNone } from '@ember/utils';
import { inject as service } from '@ember/service';

import rooms from '../const/story-rooms';
import items from '../const/story-items';
import environmentValues from '../const/environment-values';
import environmentHelpers from '../utils/environment-helpers';

const XP_PER_MOVE = 1;
const XP_PER_UNLOCK = 2;
const XP_PER_COMPLETION_ITEM = 3;
const HOME_COORD_X = 47;
const HOME_COORD_Y = 47;
const MAX_THINGS_TO_LIST = 10;

export default Service.extend({
    persistenceHandler: service(),
    inputProcessor: service(),
    
    // ------------------- private methods -------------------

    _processVariableText(text) {
        // if text is an object
        if (isPresent(text.translated)) {
            // check for posession of translator
            if (this.persistenceHandler.getStoryInventoryItems().includes(12)) {
                return text.translated;
            }
            return text.unknown;
        }

        if (isPresent(text.dark)) {
            return this._getUserCanSeeInTheDark() ?
                text.illuminated :
                text.dark;
        }

        // just return the plain string
        return text;
    },

    _getUserCanSeeInTheDark() {
        // make sure user has flashlight, it's working, and it's on.

        return this.hasFlashlight() &&
            this.persistenceHandler.getFlashlightStatus().isOn &&
            this._getIsFlashlightWorking();
    },

    _processVariableItemDescription(description) {
        if (description === environmentValues.ROBOT_RESPONSE_USED) {
            return this._getRobotResponseUsed();
        }

        return description;
    },

    _getRobotResponseUsed() {
        const remainingIds = environmentValues.COMPLETION_ITEM_IDS.filter(x => !this.persistenceHandler.getStoryCompletionItemsCollected().includes(x));
        const remainingNames = remainingIds.map((currId) => {
            return items.getItemById(currId).name;
        });
        const responses = [
            'Keep it up. Still need',
            'Keep going. Get me',
            `Still remaining ${remainingIds.length > 1 ? 'are' : 'is'}`
        ];

        return `${environmentHelpers.getRandomResponseFromList(responses)} the ${remainingNames.join(' and ')}.`;
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

    _getIsGameCompleted() {
        return this.persistenceHandler.getStoryCompletionItemsCollected().length === environmentValues.COMPLETION_ITEM_IDS.length;
    },

    _handleFlashlightBatteryDrain() {
        // if the flashlight is on
        const lightStatus = this.persistenceHandler.getFlashlightStatus();

        if (lightStatus.isOn) {
            // decrease battery
            this.persistenceHandler.setFlashlightStatus({
                isOn: lightStatus.isOn,
                batteryLevel: lightStatus.batteryLevel - 1
            });
        }
    },

    _getIsFlashlightWorking() {
        return this.persistenceHandler.getFlashlightStatus().batteryLevel > 0;
    },

    _useFlashlight() {
        // check to see if you have the flashlight
        let flashlightMessage;
        let shouldDisplayRoomDescription;

        if (this.hasFlashlight()) {
            // check battery level
            if (this._getIsFlashlightWorking()) {
                const currStatus = this.persistenceHandler.getFlashlightStatus();
                let newPowerSetting = !currStatus.isOn;

                // toggle flashlight power if the user didn't enter an on/off parameter
                const currArgs = this.inputProcessor.currentArgs;
                if (currArgs.length > 1) {
                    if (currArgs.includes('on')) {
                        if (currStatus.isOn) {

                            return {
                                flashlightMessage: ['The flashlight is already on.'],
                                shouldDisplayRoomDescription: false
                            }
                            
                        }
                        newPowerSetting = true;
                    } else if (currArgs.includes('off')) {
                        if (!currStatus.isOn) {

                            return {
                                flashlightMessage: ['The flashlight is already off.'],
                                shouldDisplayRoomDescription: false
                            }
                        }
                        newPowerSetting = false;
                    }
                }

                this.persistenceHandler.setFlashlightStatus({
                    isOn: newPowerSetting,
                    batteryLevel: currStatus.batteryLevel
                });

                flashlightMessage = ['You click the rubber domed power button on the flashlight.'];
                shouldDisplayRoomDescription = true;
            } else {
                flashlightMessage = ['You click the flashlight\'s button, but nothing happens. The batteries must be dead. You don\'t like this. You click it again just in case. Nothing.'];
            }            
        } else {
            flashlightMessage = ['You don\'t have a flashlight.'];
        }

        return {
            flashlightMessage,
            shouldDisplayRoomDescription
        }
    },

    _resetItemLocationOnDeath(itemResetObject) {
        if (!this.persistenceHandler.getStoryInventoryItems().includes(itemResetObject.itemId)) {
            const currRoomLocationForItem = this._findRoomThatContainsItem(itemResetObject.itemId);
            if (isNone(currRoomLocationForItem)) {
                return;
            }
            this.persistenceHandler.removeItemFromRoom(this._findRoomThatContainsItem(itemResetObject.itemId), itemResetObject.itemId);
            this.persistenceHandler.addItemToRoom(itemResetObject.roomId, itemResetObject.itemId);
        }
    },

    _getFlashlightDyingMessage() {
        switch(this.persistenceHandler.getFlashlightStatus().batteryLevel) {
            case 3:
                return 'The light coming from the flashlight appears to get dimmer. Might just be your imagination.';
            case 2:
                return 'The flashlight flickers off. You smash the back of it with your hand and it comes back on, but now it\'s much dimmer.';
            case 1:
                return 'The flashlight blinks on and off. You shake it. The dim beam steadies as the batteries rattle inside.';
            case 0:
                return 'With an almost silent click, the flashlight goes off. Nothing you do can turn it back on.';
        }
    },    

    _getRoomDescriptionOnly() {
        let roomDesc = this._getProcessedDescription();

        // store room as visited
        this.persistenceHandler.addStoryVisitedRoom(this.currentRoom.id);

        // add any present items to paragraph
        roomDesc = roomDesc.concat(` ${this._getItemDescriptions()}`);

        return roomDesc;
    },

    _handleAllItemsGiven() {
        // remove robot from helipad
        this.persistenceHandler.removeItemFromRoom(10, 10);

        return 'The robot looks at you for a moment, then jumps up into the air and fires a bunch of lasers into a nearby building. It pauses for a moment, then flies at horrifying speed towards some distant alien nest to eviscerate it. You stare after it for a few minutes, and realize for the first time in a long time that you are surrounded by quiet. It\'s really nice. You decide to go get some donuts.';
    },

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
    },

    // ------------------- computed properties -------------------

    currentRoom: computed('persistenceHandler.magicRobotsData.{story-pos-x,story-pos-y}', {
        get() {
            const posX = this.persistenceHandler.getStoryPosX() || HOME_COORD_X;
            const posY = this.persistenceHandler.getStoryPosY() || HOME_COORD_Y;

            return rooms.getRoom({x: posX, y: posY});
        }
    }),

    xp: computed('persistenceHandler.magicRobotsData.{story-visited-rooms,story-room-unlocked-directions,story-unlocked-items,story-completion-items}', {
        get() {
            const visitedRoomXp = this.persistenceHandler.getStoryVisitedRooms().length * XP_PER_MOVE;
            const unlockedItemXp = this.persistenceHandler.getAllUnlockedItems().length * XP_PER_UNLOCK;
            const unlockedDirectionXp = this.persistenceHandler.getAllUnlockedExits().length * XP_PER_UNLOCK;
            const completionItemXp = this.persistenceHandler.getStoryCompletionItemsCollected().length * XP_PER_COMPLETION_ITEM;

            return visitedRoomXp + unlockedItemXp + completionItemXp + unlockedDirectionXp;
        }
    }),

    maxXp: computed({
        get() {
            const exploreXp = rooms.rooms.length * XP_PER_MOVE;

            // add active unlock xp. Init with fake unlock for robot's fake unlock.
            let useXp = XP_PER_UNLOCK;
            items.items.forEach((currItem) => {
                if (isPresent(currItem.use)) {
                    useXp += XP_PER_UNLOCK;
                }
            });

            const completionItemXp = environmentValues.COMPLETION_ITEM_IDS.length * XP_PER_COMPLETION_ITEM; 

            return exploreXp +
                useXp + 
                completionItemXp;
        }
    }),

    // ------------------- public methods -------------------

    hasFlashlight() {
        return this.persistenceHandler.getStoryInventoryItems().includes(7);
    },

    reportStoryData() {
        const posX = this.persistenceHandler.getStoryPosX();
        const posY = this.persistenceHandler.getStoryPosY();
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

        console.log(`RoomID: ${this.currentRoom.id} (${posX}, ${posY}), XP: ${this.xp}, visited rooms: [${visited}], inventory: [${inventory}], room inventories: [${roomInventoriesReport}], unlocked exits: [${unlockedExitsString}], unlocked items: [${unlockedItems}]`);//eslint-disable-line no-console
    },

    formatStoryData() {
        // TODO: find a better way to store init values for everything
        // initialize defaults / start over
        this.persistenceHandler.setStoryDeaths(0);
        this.persistenceHandler.setStoryPosX(HOME_COORD_X);
        this.persistenceHandler.setStoryPosY(HOME_COORD_Y);
        this.persistenceHandler.setStoryVisitedRooms([]);
        this.persistenceHandler.setStoryInventoryItems([3]);
        this.persistenceHandler.setCakeEaten(false);
        this.persistenceHandler.setStoryRoomInventories([
            {roomId: 1, inventory: [1, 23, 25]},
            {roomId: 2, inventory: [2, 5]},
            {roomId: 3, inventory: [4]},
            {roomId: 4, inventory: [6]},
            {roomId: 5, inventory: [7, 8]},
            {roomId: 6, inventory: [20]},
            {roomId: 7, inventory: []},
            {roomId: 8, inventory: [21, 24]},
            {roomId: 9, inventory: [9]},
            {roomId: 10, inventory: [10]},
            {roomId: 11, inventory: [26]},
            {roomId: 12, inventory: []},
            {roomId: 13, inventory: []},
            {roomId: 14, inventory: []},
            {roomId: 15, inventory: [11]},
            {roomId: 16, inventory: [13, 15]},
            {roomId: 17, inventory: []},
            {roomId: 18, inventory: []},
            {roomId: 19, inventory: [14, 22]},
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
        this.persistenceHandler.setFlashlightStatus({
            isOn: false,
            batteryLevel: environmentValues.FLASHLIGHT_BATTERY_FULL
        });
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

        // handle battery drain
        this._handleFlashlightBatteryDrain();

        // warn if room is under construction
        if (isNone(nextRoomInfo.nextRoom)) {
            console.log(`WARNING: user encountered room that doesn't exist.  Developers needs to create a room at {x:${nextRoomInfo.nextX}, y:${nextRoomInfo.nextY}}`);//eslint-disable-line no-console
            return false;
        }

        // store that user has gone to the next room
        this.persistenceHandler[nextRoomInfo.positionFunctionNameSet](nextRoomInfo.newCoord);
    },

    getIsRoomTrap() {
        if (this.currentRoom.isDarkTrap) {
            return true;
        }

        if(this.currentRoom.isAirlock) {
            return true;
        }

        return false;
    },

    _getProcessedDescription() {
        return this._getIsGameCompleted() ?
            this._processVariableText(this.currentRoom.completed) :
            this._processVariableText(this.currentRoom.description);
    },

    _getProcessedSummary() {
        return this._getIsGameCompleted() ?
            this._processVariableText(this.currentRoom.completed) :
            `You are ${this._processVariableText(this.currentRoom.summary)}.`;
    },

    handleTrap() {
        this.handleDeath();

        return [this._getProcessedDescription()];
    },

    handleDeath() {
        // increment deaths
        const currDeaths = this.persistenceHandler.getStoryDeaths();
        this.persistenceHandler.setStoryDeaths(currDeaths + 1);

        // reset helmet badge and translator if they aren't in inventory
        this._resetItemLocationOnDeath(environmentValues.ROOM_RESET_BADGE);
        this._resetItemLocationOnDeath(environmentValues.ROOM_RESET_HELMET);
        this._resetItemLocationOnDeath(environmentValues.ROOM_RESET_TRANSLATOR);

        // store that you've been to room you died in
        this.persistenceHandler.addStoryVisitedRoom(this.currentRoom.id);

        // respawn
        this.persistenceHandler.setStoryPosX(environmentValues.RESPAWN_COORDS.x);
        this.persistenceHandler.setStoryPosY(environmentValues.RESPAWN_COORDS.y);

        // store that you've been to the respawn location
        this.persistenceHandler.addStoryVisitedRoom(this.currentRoom.id);
    },

    handleRobotAttack() {
        this.handleDeath();

        return ['The massive being considers you for a moment. All of a sudden, something that looks like a wingless mosquito the size of a horse attacks the robot and as it turns in defense, it knocks you off the helipad and you fall to your death.'];
    },

    whereAmI() {
        return [this._getProcessedSummary()];
    },

    getCurrentRoomDescription() {
        // are you dead?
        if (this.getIsRoomTrap()) {
            // flashlight allows you to survive
            if (!this._getUserCanSeeInTheDark()) {
                return this.handleTrap();
            }
        }

        // have you been here before?
        const roomIsNew = !this.persistenceHandler.getStoryVisitedRooms().includes(this.currentRoom.id);

        const descriptionContent = [];

        // report flashlight status if it's low
        const lightStatus = this.persistenceHandler.getFlashlightStatus();
        if (lightStatus.isOn && lightStatus.batteryLevel >= 0 && lightStatus.batteryLevel < 4) {
            descriptionContent.push(this._getFlashlightDyingMessage());
            descriptionContent.push('');
        }

        if (roomIsNew) {
            descriptionContent.push(this.getFullRoomDescription());
        } else {
            descriptionContent.push([this._getProcessedSummary()]);
        }

        return descriptionContent;
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
                return this._processVariableText(exitObject.opened);
            } else {
                return this._processVariableText(exitObject.closed);
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
        const roomDesc = this._getRoomDescriptionOnly();

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

        return targetItem.weight + this.getWeightOfUserInventory() <= environmentValues.WEIGHT_CAPACITY;
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

    feedDucks() {
        // if you've got the sandwich or pretzel
        const hasPretzel = this.persistenceHandler.getStoryInventoryItems().includes(22);
        const hasSandwich = this.persistenceHandler.getStoryInventoryItems().includes(2);
        const hasBread = hasPretzel || hasSandwich;
            
        if (hasBread) {
            const activeBreadId = hasSandwich ? 2 : 22;
            const activeBreadName = items.getItemById(activeBreadId).name;

            // delete food from story
            this.persistenceHandler.removeItemFromWorld(this.currentRoom.id, activeBreadId);

            return [`You take bits of the ${activeBreadName} and toss them in the water. Some little fishies come and nibble at them, and dart away when the ducks and geese paddle over and scoop them from the pond surface. It's soothing.`,
                '',
                `The ${activeBreadName} grows smaller and smaller and eventually is gone completely as you pluck pieces away for your new feathered friends.` ];
        } else {
            return ['If only you had some bread.'];
        }
    },

    feedRobot() {
        // if you've got the wrench
        if (this.persistenceHandler.getStoryInventoryItems().includes(9)) {
            // delete wrench from story
            this.persistenceHandler.removeItemFromWorld(this.currentRoom.id, 9);

            return ['The wrench is really heavy so you need both hands to hold it out and waggle it like a giant metal cheeto. "Hungry? Want a yummy wrench?" you say, feeling kind of idiotic.',
                '',
                'The robot focuses on you for a moment. It almost makes a gesture like it\'s chuckling. A small door opens on on its side and a long spider looking grasping appendage unfolds from within, and it lifts the wrench from your hands like it was nothing. It pulls it inside itself and you hear a muffled grinding noise.',
                '',
                'A scanning laser appears for a moment next to you on the floor of the helipad, connecting the machine\'s massive rectangular eye and the ground for a split second. Smoke wisps up from the mark burned into the metal, which I kid you not, is a smilie face emoji.' ];
        } else {
            return ['What do you think a giant robot would like as a snack?'];
        }
    },

    feedAliens() {
        this.handleDeath();

        return ['You make kissy noises trying to attract whatever you can\'t see as if it were a cute puppy.',
            '',
            '"Hey out there! Want a snack?" - you pat your pockets looking for a candy bar or something. You hear something shuffling in the dark. You reach out and turn off the light wondering if it\'s scared.',
            '',
            'The moment you click the light off, you hear a hiss and scrambling claws and before you can click the light back on or defend yourself you are eaten by an alien. You have succesfully fed the aliens.' ];
    },

    attackAlien() {
        this.handleDeath();

        return ['Making do with what you\'ve got you figure you can take this thing. It doesn\'t sound that big.',
            '',
            'You steel your nerves and try to go on the offensive. Each time you lunge forward, or creep towards it, or run full speed at it, you find it has agility far greater than your own. You still haven\'t even seen what it looks like. You are starting to wonder if it\'s all in your head and there isn\'t even anything there. You shut off the light to see if that will lure it closer.',
            '',
            'The thing comes at you as fast as the darkness does. You barely have time to react as you are gruesomely eaten by the alien. Sorry it didn\'t work out.'];
    },

    readDocument(targetItemId) {
        const currDoc = items.getItemById(targetItemId);

        if (isPresent(currDoc.use)) {
            const unlockItemId = currDoc.use.unlocks.item;
            const isNewDoc = !this.persistenceHandler.getAllUnlockedItems().includes(unlockItemId);
            if (isNewDoc) {
                // store unlock
                this.persistenceHandler.unlockItem(unlockItemId);

                // user feedback
                return [currDoc.use.response.first];
            } else {
                // user feedback
                return [currDoc.use.response.subsequent];
            }
        }

        return [`The ${currDoc.name} says:`, ''].concat(currDoc.content);
    },

    eatObject(targetItemId) {
        const currFood = items.getItemById(targetItemId);

        // delete object from world
        this.persistenceHandler.removeItemFromWorld(this.currentRoom.id, targetItemId);

        return [currFood.onEat];
    },

    drinkObject(targetItemId) {
        const currDrink = items.getItemById(targetItemId);

        // delete object from world
        this.persistenceHandler.removeItemFromWorld(this.currentRoom.id, targetItemId);

        return [currDrink.onDrink];
    },

    drinkPoison(targetItemId) {
        const currDrink = items.getItemById(targetItemId);

        // delete object from world
        this.persistenceHandler.removeItemFromWorld(this.currentRoom.id, targetItemId);

        // die
        this.handleDeath();

        // report
        return [currDrink.onDrink];
    },

    eatCake() {

        // delete cake from world
        this.persistenceHandler.removeItemFromWorld(this.currentRoom.id, 11);

        // store cake eaten achievement for status display
        this.persistenceHandler.setCakeEaten(true);

        return ['You lift the glass cover off the pedestal. You throw it on the floor, excited about finally taking a moment to yourself to eat some cake. The cover bounces with a high pitched TANG! You grasp the perfect slice of cake in one hand, gently supporting the narrow end with your pinky. You stare down your snack.', '', 'It is beautiful. You have a litte frosting on your thumb. It smells of fresh melted butter and rich milk chocolate. You close your eyes and take a bite. This cake is not a lie. It is delicious and perfect and you decide that every decision you ever made, every path you\'ve ever taken has been purposeful, to lead you to this very moment. God damn this is some good cake.' ];
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

    turnOffFlashlight() {
        const currStatus = this.persistenceHandler.getFlashlightStatus();

        this.persistenceHandler.setFlashlightStatus({
            isOn: false,
            batteryLevel: currStatus.batteryLevel
        });
    },

    useItem(targetItemId) {
        const item = items.getItemById(targetItemId);

        // kill you if it's the controls
        if (item.id === 17) {
            this.handleDeath();
            return ['You grab the levers as if you were an actual pilot. You move them around and push some buttons, seeing if anything happens. You are slammed against the back wall as the ship accelerates into the vastness of space. After a few days of hurtling through the nothingness, you die of dehydration somewhere out by UDF 2457.'];
        }

        // handle flashlight usage
        if (item.id === 7) {
            const flashlightResponse = this._useFlashlight();

            // are you dead?
            if (this.getIsRoomTrap()) {
                // flashlight allows you to survive
                if (!this._getUserCanSeeInTheDark()) {
                    const currTrapDescription = this._getRoomDescriptionOnly();

                    return this.handleTrap().concat([currTrapDescription]);
                }
            }

            return flashlightResponse.shouldDisplayRoomDescription ?
                flashlightResponse.flashlightMessage.concat(['', this.getFullRoomDescription()]) :
                flashlightResponse.flashlightMessage;
        }

        // reject usage of locked item
        if (this.getItemIsLocked(item)) {

            // if it's the robot it kills you.
            if (item.id === 10) {
                return this.handleRobotAttack();
            }

            return [`You can't figure out how to use the ${item.name}. You feel like you're missing something.`];
        }

        if (isPresent(item.use)) {

            // store unlocked status
            const isNewUnlock = !this.persistenceHandler.getIsUnlockedDirectionFromRoom(item.use.unlocks.room, item.use.unlocks.direction);
            if (isNewUnlock) {
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
            return [this._processVariableItemDescription(item.use.response.subsequent)];
        }

        return [`${item.name} is not a useable item.`];
    },

    handleCompletionEvent(completionItemId) {
        // remove item from user inventory
        this.persistenceHandler.removeStoryInventoryItem(completionItemId);

        // store item in robot inventory
        this.persistenceHandler.addStoryCompletionItemCollected(completionItemId);

        const givenItem = items.getItemById(completionItemId);

        const returnLines = [];

        let returnPhrase = '';

        switch (givenItem.id) {
            case 13:
            // disk
            returnPhrase = `You give the robot the ${givenItem.name}. A narrow pyramid of green light twists from a beacon on the robot's shoulder, and briefly scans the plastic square. It throws the disk away, having quickly ingested the data within.`;
            break;

            case 18:
            // nav-card
            returnPhrase = `You hold the ${givenItem.name} up towards the robot. A long thin grasping arm emerges from the side of its body, and it gently plucks the ${givenItem.name} from your grasp. The arm and the ${givenItem.name} disappear into the machine, and a small door grinds closed behind them. You hear some quiet beeps.`;
            break;

            case 19:
            // hypercore
            returnPhrase = `You place the heavy ${givenItem.name} in front of you. The robot turns and though it has no face, you interperet its body language as a smile. It takes an earth shaking step towards you, and the ${givenItem.name} rises. It glows brighter than usual, and almost instantly absorbs like flaming mercury into the center of the robots core. The huge machine contracts briefly, then seems to exhale as its massive rectangular eye turns a bright orange, emitting a visible churn of plasma. You feel like you just typed IDDQD.`;
            break;
        }

        // start with give
        returnLines.push(returnPhrase);

        // add list of what remains
        const completedList = this.persistenceHandler.getStoryCompletionItemsCollected();
        const fullList = environmentValues.COMPLETION_ITEM_IDS;
        if (completedList.length < fullList.length) {
            returnLines.push(this._getRobotResponseUsed());
        } else {
            returnLines.push(this._handleAllItemsGiven());
        }

        return returnLines;
    }
});
