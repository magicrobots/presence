import Route from '@ember/routing/route';
import { isPresent, isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';
import environmentValues from '../const/environment-values';
import items from '../const/story-items';
import FunCtionality from '../mixins/fun-ctionality';

export default Route.extend(FunCtionality, {
    inputProcessor: service(),
    persistenceHandler: service(),
    storyCore: service(),

    // ------------------- ember hooks -------------------

    afterModel() {
        let welcomePrefix = 'Welcome back';

        // handle initialization of story data if it doesn't exist yet
        if (this.storyCore.getIsNewStory()) {
            this.storyCore.formatStoryData();
            welcomePrefix = 'Welcome to Origin';
        }

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: this,
            response: [`${welcomePrefix} ${this.persistenceHandler.getUsername()}`, '']
                .concat(this.storyCore.getCurrentRoomDescription())
        });

        // init story in shell
        this.inputProcessor.setAppEnvironment(appEnvironment);
    },

    // ------------------- private methods -------------------

    _parseDirectionFromEntries(entries) {
        let chosenDirection = null;

        // find direction user requests
        for (let i = 0; i < entries.length; i++ ) {
            const currArg = entries[i];
            for (let j = 0; j < environmentValues.exitPossibilities.length; j++ ) {
                const currExit = environmentValues.exitPossibilities[j];
                if (currArg.toUpperCase() === currExit.abbr ||
                    currArg.toUpperCase() === currExit.word ) {
                        chosenDirection = currExit;
                }
            }
        }

        return chosenDirection;
    },

    _handlePotentiallyFatalMistake(roomOverride) {
        // is the user in space without a helmet?
        const isInSpace = this.storyCore.getIsRoomInSpace(roomOverride);
        if (isInSpace &&
            !this.persistenceHandler.getStoryInventoryItems().includes(15)) {
                this.inputProcessor.handleFunctionFromApp(['You clutch your throat as all the air rushes out of your lungs and you feel like you\'re being pulled inside out. Outer space is a dangerous place. You die quickly.']);
                this.storyCore.handleDeath();
                return true;
        }

        return false;
    },

    _showFlashlightStatus() {
        const lightStatus = this.persistenceHandler.getFlashlightStatus();

        // if you have the flashlight, show its status
        if (this.storyCore.hasFlashlight()) {
            const power = lightStatus.batteryLevel < 1 ?
                'Dead' :
                lightStatus.isOn ? 'On' : 'Off';
            return [
                `Flashlight power: ${power}`,
                '',
                'Flashlight battery level:',
                this._makeAsciiProgressBar(lightStatus.batteryLevel, environmentValues.FLASHLIGHT_BATTERY_FULL),
                ''
            ];
        }

        return [];
    },

    _makeAsciiProgressBar(curr, max) {
        const completionRatio = curr / max;
        const subtractAmount = completionRatio === 1 ? 3 : 2;
        const maxChars = this.inputProcessor.maxCharsPerLine - subtractAmount;
        const completedChars = Math.floor(completionRatio * maxChars);

        return '|'.concat('|'.padStart(completedChars - 1, '=').padEnd(maxChars - 2, '-').concat('|'));
    },

    /* ----------------------- public methods --------------------
       ------ these are also the commands the user can type ----- */

    walk() { this.go(...arguments) },
    move() { this.go(...arguments) },
    go() {
        // handle no params
        if (isEmpty(this.inputProcessor.currentArgs)) {
            this.inputProcessor.handleFunctionFromApp(['Which way do you want to go?']);
            return;
        }

        // see if user entered a direction
        const chosenDirection = this._parseDirectionFromEntries(this.inputProcessor.currentArgs);

        if (isEmpty(chosenDirection)) {
            this.inputProcessor.handleFunctionFromApp(['Please enter a valid direction to go in.']);
            return;
        }

        // if it's a valid direction, update position
        if (this.storyCore.isValidDirection(chosenDirection)) {
            const nextRoomInfo = this.storyCore.getNextRoomInfo(chosenDirection);
            
            if (this._handlePotentiallyFatalMistake(nextRoomInfo.nextRoom)) {
                return;
            }

            this.storyCore.handlePositionChange(nextRoomInfo);
            this.inputProcessor.handleFunctionFromApp(this.storyCore.getCurrentRoomDescription());
        } else {
            this.inputProcessor.handleFunctionFromApp(['you can\'t go that way.']);
        }
    },

    exits() {
        this.inputProcessor.handleFunctionFromApp([this.storyCore.getExitDescriptions()]);
    },

    items() { this.list(...arguments) },
    inventory() { this.list(...arguments) },
    list() {
        const yourItems = this.persistenceHandler.getStoryInventoryItems();

        if (yourItems.length === 0) {
            this.inputProcessor.handleFunctionFromApp(['You don\'t have anything.']);
            return;
        }

        const curr = this.storyCore.getWeightOfUserInventory();
        const weightStats = `[${curr}/${environmentValues.WEIGHT_CAPACITY}]`;
        const inventoryResponse = [`You're carrying ${weightStats}:`];

        yourItems.forEach((currItem) => {
            inventoryResponse.push(` - ${this.storyCore.getItemNameById(currItem)}`);
        });

        this.inputProcessor.handleFunctionFromApp(inventoryResponse);
    },

    pick() {
        const args = this.inputProcessor.currentArgs;

        // if use is typing 'pick up' then call 'get()'
        if (args[0] === 'up') {
            this.inputProcessor.currentArgs.shift();
            this.take();
        } else {
            this.inputProcessor.handleFunctionFromApp([`What do you want to pick up?`]);
        }
    },

    get() { this.take(...arguments) },
    take() {
        const args = this.inputProcessor.currentArgs;

        // remove 'the' if it's in there
        const targetItemName = args[0] === 'the' ? args[1] : args[0];

        // find matching item if it exists in the rooms' inventories
        const roomItems = this.storyCore.getRoomInventory();

        // if it's in the room, and it's not too heavy, get it
        const targetItemId = this.storyCore.getItemIdByName(targetItemName);

        if (isPresent(targetItemId) && roomItems.includes(targetItemId)) {
            
            if(this.storyCore.canTakeItem(targetItemId)) {
                // remove from room
                this.persistenceHandler.removeItemFromRoom(this.storyCore.getCurrentRoomId(), targetItemId);
                // add to user inventory
                this.persistenceHandler.addStoryInventoryItem(targetItemId);
                // report to user
                this.inputProcessor.handleFunctionFromApp([`You take the ${targetItemName}`]);
            } else {
                this.inputProcessor.handleFunctionFromApp([`The ${targetItemName} is too heavy.`]);
            }
        } else {
            if(isPresent(targetItemName)) {
                // if you already have it
                if (this.persistenceHandler.getStoryInventoryItems().includes(targetItemId)) {
                    this.inputProcessor.handleFunctionFromApp([`You already have the ${targetItemName}.`]);
                } else {
                    this.inputProcessor.handleFunctionFromApp([`I don't know what a ${targetItemName} is.`]);
                }
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to take?`]);
            }
        }

        this._handlePotentiallyFatalMistake();
    },

    throw() {
        this.drop(true);
    },

    discard() { this.drop(...arguments) },
    drop(isThrow) {
        const args = this.inputProcessor.currentArgs;
        const actionWord = isThrow ? 'throw' : 'drop';

        // remove 'the' if it's in there
        const targetItemName = args[0] === 'the' ? args[1] : args[0];

        // find matching item if it exists in your inventory
        const userInventory = this.persistenceHandler.getStoryInventoryItems();
        const targetItemId = this.storyCore.getItemIdByName(targetItemName);

        if (userInventory.includes(targetItemId)) {
            // add item to room
            this.persistenceHandler.addItemToRoom(this.storyCore.getCurrentRoomId(), targetItemId);
            // remove item from user inventory
            this.persistenceHandler.removeStoryInventoryItem(targetItemId);

            // if it's the flashlight, turn it off automagically
            if (targetItemId === 7) {
                this.storyCore.turnOffFlashlight();
            }

            // report to user
            const response = [`You ${actionWord} the ${targetItemName}`];
            if (isThrow) {
                response.push('');
                response.push('It doesn\'t go very far. You feel a little silly.');
            }
            this.inputProcessor.handleFunctionFromApp(response);
        } else {
            if(isPresent(targetItemName)) {
                this.inputProcessor.handleFunctionFromApp([`You don't have a ${targetItemName}.`]);
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to ${actionWord}?`]);
            }
        }

        this._handlePotentiallyFatalMistake();
    },

    inspect() { this.examine(...arguments) },
    examine(passedArgs) {
        const theArgs = passedArgs || this.inputProcessor.currentArgs;
        const objectName = theArgs[0] === 'the' ? theArgs[1] : theArgs[0];
        const localInventories = this._getLocalAndPersonalInventories();
        const objectId = this.storyCore.getItemIdByName(objectName);

        if (isPresent(objectId) && localInventories.includes(objectId)) {
            const itemDescription = this.storyCore.getItemDetailsById(objectId);
            this.inputProcessor.handleFunctionFromApp([itemDescription]);
        } else {
            if(isPresent(objectName)) {
                this.inputProcessor.handleFunctionFromApp([`You can't learn anything more about ${objectName} by examining it.`]);
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to examine?`]);
            }
        }
    },

    talk() {
        const args = this.inputProcessor.currentArgs;

        let responseObjectName = 'that';

        if (args[0] === 'to') {
            responseObjectName = args[1] === 'the' ? args[2] : args[1];
            if (responseObjectName === 'robot') {
                this.inputProcessor.overrideArgs(['robot']);
                this.use();
                return;
            }
        }

        this.inputProcessor.handleFunctionFromApp([`You don't know how to talk to ${responseObjectName}.`]);
    },

    turn() {
        const args = this.inputProcessor.currentArgs;

        const firstArg = args[0];

        if (firstArg === 'on' ||
            firstArg === 'off') {

            // remove on / off from args
            const argsMinusFirstArg = args.slice(1);
            this.inputProcessor.overrideArgs(argsMinusFirstArg.concat([firstArg]));
            this.use();

            return;
        } else if (firstArg === 'flashlight') {
            this.use();

            return;
        }

        this.inputProcessor.handleFunctionFromApp([`ERROR: I do not understand turn ${firstArg}`]);
    },

    use() {
        const args = this.inputProcessor.currentArgs;

        // remove 'the' if it's in there
        const targetItemName = args[0] === 'the' ? args[1] : args[0];
        const localInventories = this._getLocalAndPersonalInventories();
        const targetItemId = this.storyCore.getItemIdByName(targetItemName);
        const itemType = this.storyCore.getItemTypeById(targetItemId);

        // use it
        if (localInventories.includes(targetItemId) &&
            itemType === environmentValues.ITEM_TYPE_THING) {
            this.inputProcessor.handleFunctionFromApp(this.storyCore.useItem(targetItemId));
        } else {
            if(isPresent(targetItemName)) {
                this.inputProcessor.handleFunctionFromApp([`You don't have a ${targetItemName}.`]);
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to use?`]);
            }
        }
    },

    give() {
        const args = this.inputProcessor.currentArgs;
        const targetItemName = args[0];
        const operator = args[1];
        const recipientName = args[2] === 'the' ? args[3] : args[2];
        const yourItems = this.persistenceHandler.getStoryInventoryItems();
        const targetItemId = this.storyCore.getItemIdByName(targetItemName);
        const currRoom = this.storyCore.getCurrentRoomId();

        // handle thing doesn't exist
        if (isEmpty(targetItemId)) {
            this.inputProcessor.handleFunctionFromApp([`What's a ${targetItemName}?`]);
            return;
        }

        // handle you don't have the thing
        if (!yourItems.includes(targetItemId)) {
            this.inputProcessor.handleFunctionFromApp([`You don't have a ${targetItemName}`]);
            return;
        }

        // approve syntax
        if (operator === 'to') {
            // no recipient
            if (isEmpty(recipientName)) {
                this.inputProcessor.handleFunctionFromApp([`Who do you want to give the ${targetItemName} to?`]);
                return;
            }

            // you can only give to robot
            if (recipientName.toUpperCase() === 'ROBOT') {
            
                // you have to be on the helipad
                if (currRoom === 10) {

                    // you can only give completion items to robot
                    if (environmentValues.COMPLETION_ITEM_IDS.includes(targetItemId)) {
                        this.inputProcessor.handleFunctionFromApp(this.storyCore.handleCompletionEvent(targetItemId));
                        return;
                    }

                    this.inputProcessor.handleFunctionFromApp([`The robot doesn't need a ${targetItemName}.`]);
                    return;
                } else {
                    this.inputProcessor.handleFunctionFromApp([`You aren't with the robot, so you can't give it the ${targetItemName}.`]);
                    return;
                }
            }

            this.inputProcessor.handleFunctionFromApp([`You can't give the ${targetItemName} to the ${recipientName}.`]);
            return;
        }

        // improperly referenced or lacking recipient
        if (isPresent(targetItemName)) {
            this.inputProcessor.handleFunctionFromApp([`Who do you want to give the ${targetItemName} to?`]);
            return;
        }

        this.inputProcessor.handleFunctionFromApp([`What do you want to give?`]);
    },

    read() {
        const args = this.inputProcessor.currentArgs;

        // remove 'the' if it's in there
        const targetItemName = args[0] === 'the' ? args[1] : args[0];
        const localInventories = this._getLocalAndPersonalInventories();
        const targetItemId = this.storyCore.getItemIdByName(targetItemName);
        const itemType = this.storyCore.getItemTypeById(targetItemId);

        // read it
        if (localInventories.includes(targetItemId) &&
            itemType === environmentValues.ITEM_TYPE_DOC) {
            this.inputProcessor.handleFunctionFromApp(this.storyCore.readDocument(targetItemId));
        } else {
            if(isPresent(targetItemName)) {
                this.inputProcessor.handleFunctionFromApp([`The ${targetItemName} isn't a thing that you read.`]);
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to read?`]);
            }
        }
    },

    where() {
        this.inputProcessor.handleFunctionFromApp(this.storyCore.whereAmI());
    },

    surroundings() { this.look(...arguments) },
    look() {
        const args = this.inputProcessor.currentArgs;
        if (isPresent(args)) {
            const chosenDirection = this._parseDirectionFromEntries(args);
            if (args[0] === 'at') {

                // user is looking at something
                this.examine(args.slice(1));
            } else if (isPresent(chosenDirection)) {

                // user is looking in a direction
                this.inputProcessor.handleFunctionFromApp(this.storyCore.getDescriptionInDirection(chosenDirection));
            } else {
                // couldn't parse users request
                this.inputProcessor.handleFunctionFromApp(this.storyCore.getFullRoomDescription());
            }
        } else {
            this.inputProcessor.handleFunctionFromApp(this.storyCore.getFullRoomDescription());
        }
    },

    save() {
        this.inputProcessor.handleFunctionFromApp(['Story progress is auto-saved to local client, no need to manually save.  But I like that you care.']);
    },

    xp() {
        this.inputProcessor.handleFunctionFromApp([`Your XP: ${this.storyCore.xp} / ${this.storyCore.maxXp}`]);
    },

    report() {
        this.storyCore.reportStoryData();
        this.inputProcessor.handleFunctionFromApp(['Processing report...', 'Done.', '', 'See console.']);
    },

    progress() { this.status(...arguments) },
    status() {
        // show flashlight status if applicable
        let result = this._showFlashlightStatus();

        // get max XP:
        const maxXp = this.storyCore.maxXp;
        const currXp = this.storyCore.xp;

        // deaths:
        const deathCount = this.persistenceHandler.getStoryDeaths();

        // create ASCII graph
        let barProgress = this._makeAsciiProgressBar(currXp, maxXp);

        // hacker report
        const isHacker = this.persistenceHandler.getAllUnlockedItems().includes(1);
        const hackerReport = isHacker ? ['', 'Hacker Status:', ' [x] hacker'] : [];

        // show completion status if you've unlocked robot
        const completionReport = [];

        const hasUnlockedRobot = this.persistenceHandler.getAllUnlockedItems().includes(10);
        if (hasUnlockedRobot) {
            const hasCompletedGame = this.storyCore._getIsGameCompleted();

            // add blank line
            completionReport.push('');

            // add completion status
            if (hasCompletedGame) {
                completionReport.push('You have totally saved the world.  Nice work.');
                completionReport.push(' [x] self satisfaction, relief');
            } else {
                completionReport.push('Robot\'s Quest:');
    
                const collectedCompletionItems = this.persistenceHandler.getStoryCompletionItemsCollected();
    
                environmentValues.COMPLETION_ITEM_IDS.forEach((currCompletionId) => {
                    const itemObtained = collectedCompletionItems.includes(currCompletionId);
                    const itemName = items.getItemById(currCompletionId).name;
                    completionReport.push(` [${itemObtained ? 'x' : ' '}] ${itemName}`);
                });
            }
        }

        // result
        const isExplorer = maxXp === currXp;
        if (isExplorer) {
            result.push('');
            result.push('You really get around.');
            result.push(' [x] explorer');
        } else {
            result = result.concat(['Explorer:', barProgress]);
        }

        // deaths, hacker, robot completion
        result = result.concat(hackerReport.concat(completionReport));

        // cake
        if (this.persistenceHandler.getCakeEaten()) {
            result.push('');
            result.push('You ate the cake.');
            result.push(' [x] happiness');
        }

        // deaths
        const deaths = ['', `Deaths: ${deathCount}`];
        result.push(deaths);

        // share response
        this.inputProcessor.handleFunctionFromApp(result);
    },

    format() {
        // resets story
        this.storyCore.formatStoryData();
        this.inputProcessor.handleFunctionFromApp([this.welcomeMessage, ''].concat(this.storyCore.getCurrentRoomDescription()));
    },

    quit() {
        this.inputProcessor.quit();
    },

    clear() {
        this.inputProcessor.clear();
    },

    help() {
        this.inputProcessor.handleFunctionFromApp(['Origin help:',
            '',
            'This is an interactive text adventure. Here is a list of some of the basic commands you can use, but there are plenty of others (some of which are required to WIN) you can find by experimenting.',
            '',
            '  look ...... Describes your surroundings.',
            '  exits ..... Lists the exits in a room.',
            '  go ........ Followed by a direction; moves between areas.',
            '  use ....... Certain items in the environment are useable.',
            '  read ...... Readable things can be read.',
            '  take ...... If you see something and want it ... take it!',
            '  drop ...... If you have something you can drop it.',
            '  inventory . Lists items you possess.',
            '  examine ... Describes items in detail.',
            '  progress .. Displays progress through Origin.',
            '  format .... Resets your game if you want to start again. Careful!',
            '',
            'Have fun!']);
    },

    commandComplete(fragment) {
        const commandRegistry = [
            'status',
            'progress',
            'report',
            'xp',
            'save',
            'look',
            'where',
            'read',
            'give',
            'use',
            'talk',
            'examine',
            'inspect',
            'drop',
            'discard',
            'take',
            'get',
            'pick',
            'list',
            'inventory',
            'items',
            'go',
            'move',
            'walk',
            'hello',
            'sup',
            'hi',
            'clear',
            'quit',
            'help',
            'turn',
            'eat',
            'drink',
            'surroundings',
            'wave',
            'stab',
            'attack',
            'kill',
            'throw',
            'smash',
            'destroy'
        ];

        return environmentHelpers.handleTabComplete(fragment, [commandRegistry, items.items.mapBy('name')]);
    }
});
