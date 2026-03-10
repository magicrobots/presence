import rooms from '../constants/story-rooms';
import items from '../constants/story-items';
import environmentValues from '../constants/environment-values';
import MagicNumbers from '../constants/magic-numbers';
import environmentHelpers from './environment-helpers';
import persistence from '../hooks/usePersistence';

// ------------------- private methods -------------------

function _processVariableText(text) {
    // if text is an object
    if (text.translated != null) {
        // check for posession of translator
        if (persistence.getStoryInventoryItems().includes(12)) {
            return text.translated;
        }
        return text.unknown;
    }

    if (text.dark != null) {
        return _getUserCanSeeInTheDark() ?
            text.illuminated :
            text.dark;
    }

    // just return the plain string
    return text;
}

function _getUserCanSeeInTheDark() {
    // make sure user has flashlight, it's working, and it's on.

    return hasFlashlight() &&
        persistence.getFlashlightStatus().isOn &&
        _getIsFlashlightWorking();
}

function _processVariableItemDescription(description) {
    if (description === environmentValues.ROBOT_RESPONSE_USED) {
        return _getRobotResponseUsed();
    }

    return description;
}

function _getRobotResponseUsed() {
    const remainingIds = environmentValues.COMPLETION_ITEM_IDS.filter(x => !persistence.getStoryCompletionItemsCollected().includes(x));
    const remainingNames = remainingIds.map((currId) => {
        return items.getItemById(currId).name;
    });
    const responses = [
        'Keep it up. Still need',
        'Keep going. Get me',
        `Still remaining ${remainingIds.length > 1 ? 'are' : 'is'}`
    ];

    return `The robot booms "${environmentHelpers.getRandomResponseFromList(responses)} the ${remainingNames.join(' and ')}."`;
}

function _findRoomThatContainsItem(itemId) {
    const allRooms = persistence.getStoryRoomInventories();
    for (let i = 0; i < allRooms.length; i++) {
        const currRoomRef = allRooms[i];
        if (currRoomRef.inventory.includes(itemId)) {
            return currRoomRef.roomId;
        }
    }

    return null;
}

// _shuffleArray stolen outright from https://jsfiddle.net/Jonathan_Ironman/hbtq58m4/

function _shuffleArray(array) {
    var counter = array.length, temp, index;
    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

function _getIsGameCompleted() {
    return persistence.getStoryCompletionItemsCollected().length === environmentValues.COMPLETION_ITEM_IDS.length;
}

function _handleFlashlightBatteryDrain() {
    // if the flashlight is on
    const lightStatus = persistence.getFlashlightStatus();

    if (lightStatus.isOn) {
        // decrease battery
        persistence.setFlashlightStatus({
            isOn: lightStatus.isOn,
            batteryLevel: lightStatus.batteryLevel - 1
        });
    }
}

function _getIsFlashlightWorking() {
    return persistence.getFlashlightStatus().batteryLevel > 0;
}

function _useFlashlight(currentArgs) {
    // check to see if you have the flashlight
    let flashlightMessage;
    let shouldDisplayRoomDescription;

    if (hasFlashlight()) {
        // check battery level
        if (_getIsFlashlightWorking()) {
            const currStatus = persistence.getFlashlightStatus();
            let newPowerSetting = !currStatus.isOn;

            // toggle flashlight power if the user didn't enter an on/off parameter
            if (currentArgs.length > 1) {
                if (currentArgs.includes('on')) {
                    if (currStatus.isOn) {

                        return {
                            flashlightMessage: ['The flashlight is already on.'],
                            shouldDisplayRoomDescription: false
                        }

                    }
                    newPowerSetting = true;
                } else if (currentArgs.includes('off')) {
                    if (!currStatus.isOn) {

                        return {
                            flashlightMessage: ['The flashlight is already off.'],
                            shouldDisplayRoomDescription: false
                        }
                    }
                    newPowerSetting = false;
                }
            }

            persistence.setFlashlightStatus({
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
}

function _resetItemLocationOnDeath(itemResetObject) {
    if (!persistence.getStoryInventoryItems().includes(itemResetObject.itemId)) {
        const currRoomLocationForItem = _findRoomThatContainsItem(itemResetObject.itemId);
        if (currRoomLocationForItem == null) {
            return;
        }
        persistence.removeItemFromRoom(_findRoomThatContainsItem(itemResetObject.itemId), itemResetObject.itemId);
        persistence.addItemToRoom(itemResetObject.roomId, itemResetObject.itemId);
    }
}

function _getFlashlightDyingMessage() {
    switch (persistence.getFlashlightStatus().batteryLevel) {
        case 3:
            return 'The light coming from the flashlight appears to get dimmer. Might just be your imagination.';
        case 2:
            return 'The flashlight flickers off. You smash the back of it with your hand and it comes back on, but now it\'s much dimmer.';
        case 1:
            return 'The flashlight blinks on and off. You shake it. The dim beam steadies as the batteries rattle inside.';
        case 0:
            return 'With an almost silent click, the flashlight goes off. Nothing you do can turn it back on.';
    }
}

function _getRoomDescriptionOnly() {
    const currentRoom = _getCurrentRoom();
    let roomDesc = _getProcessedDescription();

    // store room as visited
    persistence.addStoryVisitedRoom(currentRoom.id);

    // add any present items to paragraph
    roomDesc = roomDesc.concat(` ${_getItemDescriptions()}`);

    return roomDesc;
}

function _handleAllItemsGiven() {
    // remove robot from helipad
    persistence.removeItemFromRoom(10, 10);

    return 'The robot looks at you for a moment, then jumps up into the air and fires a bunch of lasers into a nearby building. It pauses for a moment, then flies at horrifying speed towards some distant alien nest to eviscerate it. You stare after it for a few minutes, and realize for the first time in a long time that you are surrounded by quiet. It\'s really nice. You decide to go get some donuts.';
}

function _getItemDescriptions() {
    const roomInventory = getRoomInventory();

    if (roomInventory.length > 0) {
        if (roomInventory.length > MagicNumbers.MAX_THINGS_TO_LIST) {
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

// ------------------- computed properties (now plain functions) -------------------

function _getCurrentRoom() {
    const posX = persistence.getStoryPosX() || MagicNumbers.HOME_COORD_X;
    const posY = persistence.getStoryPosY() || MagicNumbers.HOME_COORD_Y;

    return rooms.getRoom({x: posX, y: posY});
}

function getXp() {
    const visitedRoomXp = persistence.getStoryVisitedRooms().length * MagicNumbers.XP_PER_MOVE;
    const unlockedItemXp = persistence.getAllUnlockedItems().length * MagicNumbers.XP_PER_UNLOCK;
    const unlockedDirectionXp = persistence.getAllUnlockedExits().length * MagicNumbers.XP_PER_UNLOCK;
    const completionItemXp = persistence.getStoryCompletionItemsCollected().length * MagicNumbers.XP_PER_COMPLETION_ITEM;

    return visitedRoomXp + unlockedItemXp + completionItemXp + unlockedDirectionXp;
}

function getMaxXp() {
    const exploreXp = rooms.rooms.length * MagicNumbers.XP_PER_MOVE;

    // add active unlock xp. Init with fake unlock for robot's fake unlock.
    let useXp = MagicNumbers.XP_PER_UNLOCK;
    items.items.forEach((currItem) => {
        if (currItem.use != null) {
            useXp += MagicNumbers.XP_PER_UNLOCK;
        }
    });

    const completionItemXp = environmentValues.COMPLETION_ITEM_IDS.length * MagicNumbers.XP_PER_COMPLETION_ITEM;

    return exploreXp +
        useXp +
        completionItemXp;
}

// ------------------- public methods -------------------

function getIsNewStory() {
    const inventory = persistence.getStoryInventoryItems();
    if (inventory == null) return true;

    // undefined/true → is initial visit; false → has visited before
    return persistence.getIsInitialVisit() !== false;
}

function hasFlashlight() {
    return persistence.getStoryInventoryItems().includes(7);
}

function reportStoryData() {
    const currentRoom = _getCurrentRoom();
    const posX = persistence.getStoryPosX();
    const posY = persistence.getStoryPosY();
    const visited = persistence.getStoryVisitedRooms();
    const inventory = persistence.getStoryInventoryItems();

    // handle room inventories
    const roomInventories = persistence.getStoryRoomInventories();
    let roomInventoriesReport = '';
    roomInventories.forEach((currRoom, i, roomInventories) => {
        const roomString = `{roomId: ${currRoom.roomId}, inventory: [${currRoom.inventory}]}`;
        roomInventoriesReport = roomInventoriesReport.concat(roomString);

        // add commas and separators
        if (i < roomInventories.length - 1) {
            roomInventoriesReport = roomInventoriesReport.concat(', ');
        }
    });

    const unlockedExits = persistence.getAllUnlockedExits();
    let unlockedExitsString = '';
    unlockedExits.forEach((currRoom, i, unlockedExits) => {
        const roomString = `{roomId: ${currRoom.roomId}, unlocked: [${currRoom.unlocked}]}`;
        unlockedExitsString = unlockedExitsString.concat(roomString);

        // add commas and separators
        if (i < unlockedExits.length - 1) {
            unlockedExitsString = unlockedExitsString.concat(', ');
        }
    });

    const unlockedItems = persistence.getAllUnlockedItems();

    console.log(`RoomID: ${currentRoom.id} (${posX}, ${posY}), XP: ${getXp()}, visited rooms: [${visited}], inventory: [${inventory}], room inventories: [${roomInventoriesReport}], unlocked exits: [${unlockedExitsString}], unlocked items: [${unlockedItems}]`);//eslint-disable-line no-console
}

function formatStoryData() {
    // TODO: find a better way to store init values for everything
    // initialize defaults / start over
    persistence.setStoryDeaths(0);
    persistence.setStoryPosX(MagicNumbers.HOME_COORD_X);
    persistence.setStoryPosY(MagicNumbers.HOME_COORD_Y);
    persistence.setStoryVisitedRooms([]);
    persistence.setStoryInventoryItems(MagicNumbers.INIT_USER_INVENTORY);
    persistence.setCakeEaten(false);
    persistence.setIsInitialVisit(true);
    persistence.setStoryRoomInventories([
        {roomId: 1, inventory: MagicNumbers.INIT_ROOM_ONE_INVENTORY},
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
    persistence.clearAllUnlockedDirections();
    persistence.setAllUnlockedItems([]);
    persistence.setStoryCompletionItemsCollected([]);
    persistence.setFlashlightStatus({
        isOn: false,
        batteryLevel: environmentValues.FLASHLIGHT_BATTERY_FULL
    });
}

function isValidDirection(enteredDirection) {
    const currentRoom = _getCurrentRoom();

    if (enteredDirection == null) {
        return false;
    }

    if (currentRoom.exits[enteredDirection.abbr] != null) {
        return getIsExitUnlocked(currentRoom, enteredDirection.abbr);
    }

    return false;
}

function getNextRoomInfo(enteredDirection) {
    const currentRoom = _getCurrentRoom();
    const changeAxis = enteredDirection.coordModifier.direction;
    const positionFunctionNameGet = `getStoryPos${changeAxis}`;
    const positionFunctionNameSet = `setStoryPos${changeAxis}`;
    const currentCoordValue = persistence[positionFunctionNameGet]();
    const newCoord = currentCoordValue + enteredDirection.coordModifier.amount;

    // get coordinates in movement direction, find destination room
    const nextX = changeAxis === 'X' ?
        currentRoom.x + enteredDirection.coordModifier.amount :
        currentRoom.x;
    const nextY = changeAxis === 'Y' ?
        currentRoom.y + enteredDirection.coordModifier.amount :
        currentRoom.y;
    const nextRoom = rooms.getRoom({x: nextX, y: nextY});

    return {nextRoom,
        nextX,
        nextY,
        newCoord,
        positionFunctionNameSet};
}

function handlePositionChange(nextRoomInfo) {

    // handle battery drain
    _handleFlashlightBatteryDrain();

    // warn if room is under construction
    if (nextRoomInfo.nextRoom == null) {
        console.log(`WARNING: user encountered room that doesn't exist.  Developers needs to create a room at {x:${nextRoomInfo.nextX}, y:${nextRoomInfo.nextY}}`);//eslint-disable-line no-console
        return false;
    }

    // store that user has gone to the next room
    persistence[nextRoomInfo.positionFunctionNameSet](nextRoomInfo.newCoord);
}

function getIsRoomTrap() {
    const currentRoom = _getCurrentRoom();
    if (currentRoom.isDarkTrap) {
        return true;
    }

    if (currentRoom.isAirlock) {
        return true;
    }

    return false;
}

function _getProcessedDescription() {
    const currentRoom = _getCurrentRoom();
    return _getIsGameCompleted() ?
        _processVariableText(currentRoom.completed) :
        _processVariableText(currentRoom.description);
}

function _getProcessedSummary() {
    const currentRoom = _getCurrentRoom();
    return _getIsGameCompleted() ?
        _processVariableText(currentRoom.completed) :
        `You are ${_processVariableText(currentRoom.summary)}.`;
}

function handleTrap() {
    const trapResponse = _getProcessedDescription();
    handleDeath();

    return [trapResponse];
}

function handleDeath() {
    const currentRoom = _getCurrentRoom();
    // increment deaths
    const currDeaths = persistence.getStoryDeaths();
    persistence.setStoryDeaths(currDeaths + 1);

    // reset helmet badge and translator if they aren't in inventory
    _resetItemLocationOnDeath(environmentValues.ROOM_RESET_BADGE);
    _resetItemLocationOnDeath(environmentValues.ROOM_RESET_HELMET);
    _resetItemLocationOnDeath(environmentValues.ROOM_RESET_TRANSLATOR);

    // store that you've been to room you died in
    persistence.addStoryVisitedRoom(currentRoom.id);

    // respawn
    persistence.setStoryPosX(environmentValues.RESPAWN_COORDS.x);
    persistence.setStoryPosY(environmentValues.RESPAWN_COORDS.y);

    // store that you've been to the respawn location
    persistence.addStoryVisitedRoom(currentRoom.id);
}

function handleRobotAttack() {
    handleDeath();

    return ['The massive being considers you for a moment. All of a sudden, something that looks like a wingless mosquito the size of a horse attacks the robot and as it turns in defense, it knocks you off the helipad and you fall to your death.'];
}

function whereAmI() {
    return [_getProcessedSummary()];
}

function getCurrentRoomDescription() {
    // are you dead?
    if (getIsRoomTrap()) {
        // flashlight allows you to survive
        if (!_getUserCanSeeInTheDark()) {
            return handleTrap();
        }
    }

    const currentRoom = _getCurrentRoom();
    // have you been here before?
    const roomIsNew = !persistence.getStoryVisitedRooms().includes(currentRoom.id);

    const descriptionContent = [];

    // report flashlight status if it's low
    const lightStatus = persistence.getFlashlightStatus();
    if (lightStatus.isOn && lightStatus.batteryLevel >= 0 && lightStatus.batteryLevel < 4) {
        descriptionContent.push(_getFlashlightDyingMessage());
        descriptionContent.push('');
    }

    if (roomIsNew) {
        descriptionContent.push(getFullRoomDescription());
    } else {
        descriptionContent.push([_getProcessedSummary()]);
    }

    return descriptionContent;
}

function getCurrentRoomId() {
    return _getCurrentRoom().id;
}

function getIsRoomInSpace(roomOverride) {
    const testRoom = roomOverride != null ? roomOverride : _getCurrentRoom();

    return testRoom.isInSpace != null && testRoom.isInSpace === true;
}

function getDescriptionInDirection(lookDirection) {
    const currentRoom = _getCurrentRoom();
    const exitInDirection = currentRoom.exits[lookDirection.abbr];
    if (exitInDirection != null) {
        return [getExitDescription(currentRoom.id, lookDirection.abbr)];
    } else {
        return [`There is nothing of interest to the ${lookDirection.word.toLowerCase()}`];
    }
}

function getExitDescriptions() {
    const currentRoom = _getCurrentRoom();
    const exitDescs = [];
    const scope = currentRoom;
    environmentValues.exitPossibilities.forEach((currPossibility) => {
        const currExitDescription = getExitDescription(scope.id, currPossibility.abbr);
        if (currExitDescription != null) {
            exitDescs.push(`${_processVariableText(currExitDescription)}`);
        }
    });

    return _shuffleArray(exitDescs).join(' ');
}

function getExitDescription(roomId, exitOrientation) {
    const room = rooms.getRoomById(roomId);
    const exitObject = room.exits[exitOrientation];

    if (exitObject != null) {
        if (getIsExitUnlocked(room, exitOrientation)) {
            return _processVariableText(exitObject.opened);
        } else {
            return _processVariableText(exitObject.closed);
        }
    }

    return null;
}

function getIsExitUnlocked(room, exitOrientation) {
    const targetOrientation = room.exits[exitOrientation];

    if (targetOrientation != null) {
        if (targetOrientation.closed != null) {
            // either unlocked by using item
            const isUnlockedByUse = persistence.getIsUnlockedDirectionFromRoom(room.id, exitOrientation);
            if (isUnlockedByUse) {
                return true;
            }

            // or is unlocked by having key in inventory
            const inventory = persistence.getStoryInventoryItems();
            let hasKey = false;
            inventory.forEach((currInventoryItemId) => {
                const currItem = items.getItemById(currInventoryItemId);
                if (currItem.isKey != null) {
                    if (currItem.isKey.room != null) {
                        if (currItem.isKey.room === room.id &&
                            currItem.isKey.direction === exitOrientation) {
                            hasKey = true;
                        }
                    } else if (currItem.isKey.length != null) {
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
}

function getFullRoomDescription() {
    const roomDesc = _getRoomDescriptionOnly();

    // add empty line
    const fullDesc = [roomDesc].concat(['']);

    // add exits
    fullDesc.push(getExitDescriptions());

    return fullDesc;
}

function getWeightOfUserInventory() {
    const userInventory = persistence.getStoryInventoryItems();
    let totalWeight = 0;

    userInventory.forEach((currItemId) => {
        const currItemWeight = items.getItemById(currItemId).weight;
        totalWeight += currItemWeight;
    });

    return totalWeight;
}

function canTakeItem(targetItemId) {
    const targetItem = items.getItemById(targetItemId);

    return targetItem.weight + getWeightOfUserInventory() <= environmentValues.WEIGHT_CAPACITY;
}

function getRoomInventory() {
    return persistence.getStoryRoomInventoryById(_getCurrentRoom().id);
}

function getItemNameById(searchId) {
    const item = items.getItemById(searchId);

    return item != null ? item.name : null;
}

function getItemIdByName(itemName) {
    const item = items.getItemByName(itemName);

    return item != null ? item.id : null;
}

function getItemDetailsById(searchId) {
    const item = items.getItemById(searchId);

    // if it's a useable item, return details based on whether or not it's used
    let isUsed = false;
    if (item.use != null) {
        // if it's a document check used items for item id
        if (item.type === environmentValues.ITEM_TYPE_DOC) {
            const unlockedItems = persistence.getAllUnlockedItems();
            if (unlockedItems.includes(item.use.unlocks.item)) {
                isUsed = true;
            }
        } else {
            // if it's a thing check unlocked rooms for use unlock room id
            if (persistence.getIsUnlockedDirectionFromRoom(item.use.unlocks.room, item.use.unlocks.direction)) {
                isUsed = true;
            }
        }
    }

    const detailsResponse = isUsed ? item.detailsUsed : item.details;

    return item != null ? detailsResponse : null;
}

function getItemTypeById(searchId) {
    const item = items.getItemById(searchId);

    return item != null ? item.type : null;
}

function feedDucks() {
    const currentRoom = _getCurrentRoom();
    // if you've got the sandwich or pretzel
    const hasPretzel = persistence.getStoryInventoryItems().includes(22);
    const hasSandwich = persistence.getStoryInventoryItems().includes(2);
    const hasBread = hasPretzel || hasSandwich;

    if (hasBread) {
        const activeBreadId = hasSandwich ? 2 : 22;
        const activeBreadName = items.getItemById(activeBreadId).name;

        // delete food from story
        persistence.removeItemFromWorld(currentRoom.id, activeBreadId);

        return [`You take bits of the ${activeBreadName} and toss them in the water. Some little fishies come and nibble at them, and dart away when the ducks and geese paddle over and scoop them from the pond surface. It's soothing.`,
            '',
            `The ${activeBreadName} grows smaller and smaller and eventually is gone completely as you pluck pieces away for your new feathered friends.`];
    } else {
        return ['If only you had some bread.'];
    }
}

function feedRobot() {
    const currentRoom = _getCurrentRoom();
    // if you've got the wrench
    if (persistence.getStoryInventoryItems().includes(9)) {
        // delete wrench from story
        persistence.removeItemFromWorld(currentRoom.id, 9);

        return ['The wrench is really heavy so you need both hands to hold it out and waggle it like a giant metal cheeto. "Hungry? Want a yummy wrench?" you say, feeling kind of idiotic.',
            '',
            'The robot focuses on you for a moment. It almost makes a gesture like it\'s chuckling. A small door opens on on its side and a long spider like grasping appendage unfolds from within, and it lifts the wrench from your hands like it was nothing. It pulls it inside itself and you hear a muffled grinding noise.',
            '',
            'A scanning laser appears for a moment next to you on the floor of the helipad, connecting the machine\'s massive rectangular eye and the ground for a split second. Smoke wisps up from the mark burned into the metal, which looks like a square with an X inscribed within.'];
    } else {
        return ['What do you think a giant robot would like as a snack?'];
    }
}

function feedAliens() {
    handleDeath();

    return ['You make kissy noises trying to attract whatever you can\'t see as if it were a cute puppy.',
        '',
        '"Hey out there! Want a snack?" - you pat your pockets looking for a candy bar or something. You hear something shuffling in the dark. You reach out and turn off the light wondering if it\'s scared.',
        '',
        'The moment you click the light off, you hear a hiss and scrambling claws and before you can click the light back on or defend yourself you are eaten by an alien. You have succesfully fed the aliens.'];
}

function attackAlien() {
    handleDeath();

    return ['Making do with what you\'ve got you figure you can take this thing. It doesn\'t sound that big.',
        '',
        'You steel your nerves and try to go on the offensive. Each time you lunge forward, or creep towards it, or run full speed at it, you find it has agility far greater than your own. You still haven\'t even seen what it looks like. You are starting to wonder if it\'s all in your head and there isn\'t even anything there. You shut off the light to see if that will lure it closer.',
        '',
        'The thing comes at you as fast as the darkness does. You barely have time to react as you are gruesomely eaten by the alien. Sorry it didn\'t work out.'];
}

function readDocument(targetItemId) {
    const currDoc = items.getItemById(targetItemId);

    if (currDoc.use != null) {
        const unlockItemId = currDoc.use.unlocks.item;
        const isNewDoc = !persistence.getAllUnlockedItems().includes(unlockItemId);
        if (isNewDoc) {
            // store unlock
            persistence.unlockItem(unlockItemId);

            // user feedback
            return [currDoc.use.response.first];
        } else {
            // user feedback
            return [currDoc.use.response.subsequent];
        }
    }

    return [`The ${currDoc.name} says:`, ''].concat(currDoc.content);
}

function eatObject(targetItemId) {
    const currentRoom = _getCurrentRoom();
    const currFood = items.getItemById(targetItemId);

    // delete object from world
    persistence.removeItemFromWorld(currentRoom.id, targetItemId);

    return [currFood.onEat];
}

function drinkObject(targetItemId) {
    const currentRoom = _getCurrentRoom();
    const currDrink = items.getItemById(targetItemId);

    // delete object from world
    persistence.removeItemFromWorld(currentRoom.id, targetItemId);

    return [currDrink.onDrink];
}

function drinkPoison(targetItemId) {
    const currentRoom = _getCurrentRoom();
    const currDrink = items.getItemById(targetItemId);

    // delete object from world
    persistence.removeItemFromWorld(currentRoom.id, targetItemId);

    // die
    handleDeath();

    // report
    return [currDrink.onDrink];
}

function eatCake() {
    const currentRoom = _getCurrentRoom();

    // delete cake from world
    persistence.removeItemFromWorld(currentRoom.id, 11);

    // store cake eaten achievement for status display
    persistence.setCakeEaten(true);

    return ['You lift the glass cover off the pedestal. You throw it on the floor, excited about finally taking a moment to yourself to eat some cake. The cover bounces with a high pitched TANG! You grasp the perfect slice of cake in one hand, gently supporting the narrow end with your pinky. You stare down your snack.', '', 'It is beautiful. You have a litte frosting on your thumb. It smells of fresh melted butter and rich milk chocolate. You close your eyes and take a bite. This cake is not a lie. It is delicious and perfect and you decide that every decision you ever made, every path you\'ve ever taken has been purposeful, to lead you to this very moment. God damn this is some good cake.'];
}

function getItemIsLocked(item) {
    const lockList = [];
    const passiveKeyItems = [];
    const passiveKeyIds = [];
    items.items.forEach((currItem) => {
        // list of things unlocked by using an item
        if (currItem.type === environmentValues.ITEM_TYPE_DOC) {
            if (currItem.use != null) {
                if (currItem.use.unlocks != null) {
                    if (currItem.use.unlocks.item != null) {
                        lockList.push(currItem.use.unlocks.item);
                    }
                }
            }
        } else {
            // list of things unlocked by having an item in your inventory
            if (currItem.type === environmentValues.ITEM_TYPE_THING) {
                if (currItem.isKey != null) {
                    if (currItem.isKey.item != null) {
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

        // check if item is unlocked passively by having a key item
        const userInventory = persistence.getStoryInventoryItems();
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
}

function turnOffFlashlight() {
    const currStatus = persistence.getFlashlightStatus();

    persistence.setFlashlightStatus({
        isOn: false,
        batteryLevel: currStatus.batteryLevel
    });
}

// currentArgs is passed in from the calling route (replaces this.inputProcessor.currentArgs)
function useItem(targetItemId, currentArgs) {
    const item = items.getItemById(targetItemId);

    // kill you if it's the controls
    if (item.id === 17) {
        handleDeath();
        return ['You grab the levers as if you were an actual pilot. You move them around and push some buttons, seeing if anything happens. You are slammed against the back wall as the ship accelerates into the vastness of space. After a few days of hurtling through the nothingness, you die of dehydration somewhere out by UDF 2457.'];
    }

    // handle flashlight usage
    if (item.id === 7) {
        const flashlightResponse = _useFlashlight(currentArgs);

        // are you dead?
        if (getIsRoomTrap()) {
            // flashlight allows you to survive
            if (!_getUserCanSeeInTheDark()) {
                const currTrapDescription = _getRoomDescriptionOnly();

                return handleTrap().concat([currTrapDescription]);
            }
        }

        return flashlightResponse.shouldDisplayRoomDescription ?
            flashlightResponse.flashlightMessage.concat(['', getFullRoomDescription()]) :
            flashlightResponse.flashlightMessage;
    }

    // reject usage of locked item
    if (getItemIsLocked(item)) {

        // if it's the robot it kills you.
        if (item.id === 10) {
            return handleRobotAttack();
        }

        return [`You can't figure out how to use the ${item.name}. You feel like you're missing something.`];
    }

    if (item.use != null) {

        // store unlocked status
        const isNewUnlock = !persistence.getIsUnlockedDirectionFromRoom(item.use.unlocks.room, item.use.unlocks.direction);
        if (isNewUnlock) {
            // store unlock change
            persistence.setIsUnlockedDirectionInRoom(item.use.unlocks.room, item.use.unlocks.direction);

            // handle special events
            if (item.id === 10) {
                // robot drops translator in helipad
                persistence.addItemToRoom(10, 12);
                // force unlock robot so he doesn't kill you
                persistence.unlockItem(10);
            }

            // user feedback
            return [item.use.response.first];
        }

        // tell user something happened
        return [_processVariableItemDescription(item.use.response.subsequent)];
    }

    return [`${item.name} is not a useable item.`];
}

function handleCompletionEvent(completionItemId) {
    // remove item from user inventory
    persistence.removeStoryInventoryItem(completionItemId);

    // store item in robot inventory
    persistence.addStoryCompletionItemCollected(completionItemId);

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
    const completedList = persistence.getStoryCompletionItemsCollected();
    const fullList = environmentValues.COMPLETION_ITEM_IDS;
    if (completedList.length < fullList.length) {
        returnLines.push(_getRobotResponseUsed());
    } else {
        returnLines.push(_handleAllItemsGiven());
    }

    return returnLines;
}

export default {
    getXp,
    getMaxXp,
    getIsNewStory,
    hasFlashlight,
    reportStoryData,
    formatStoryData,
    isValidDirection,
    getNextRoomInfo,
    handlePositionChange,
    getIsRoomTrap,
    handleTrap,
    handleDeath,
    handleRobotAttack,
    whereAmI,
    getCurrentRoomDescription,
    getCurrentRoomId,
    getIsRoomInSpace,
    getDescriptionInDirection,
    getExitDescriptions,
    getExitDescription,
    getIsExitUnlocked,
    getFullRoomDescription,
    getWeightOfUserInventory,
    canTakeItem,
    getRoomInventory,
    getItemNameById,
    getItemIdByName,
    getItemDetailsById,
    getItemTypeById,
    feedDucks,
    feedRobot,
    feedAliens,
    attackAlien,
    readDocument,
    eatObject,
    drinkObject,
    drinkPoison,
    eatCake,
    getItemIsLocked,
    turnOffFlashlight,
    useItem,
    handleCompletionEvent,
    _getIsGameCompleted,
};
