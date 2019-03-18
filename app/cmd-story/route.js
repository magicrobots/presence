import Route from '@ember/routing/route';
import { computed, aliasMethod } from '@ember/object';
import { isPresent, isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';
import environmentValues from '../const/environment-values';

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),
    storyCore: service(),

    // ------------------- ember hooks -------------------

    afterModel() {
        // handle initialization of story data if it doesn't exist yet
        if (this.isNewStory) {
            this.storyCore.formatStoryData();
        }

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: this,
            response: [this.welcomeMessage].concat(this.storyCore.getCurrentRoomDescription())
        });

        // init story in shell
        this.inputProcessor.setAppEnvironment(appEnvironment);
    },

    // ------------------- computed properties -------------------

    welcomeMessage: computed('persistenceHandler.magicRobotsData.story-xp', {
        get() {
            return this.isNewStory ?
                'Welcome to story.' :
                'Welcome back.';
        }
    }),

    isNewStory: computed('persistenceHandler.magicRobotsData.story-xp', {
        get() {
            const xp = this.persistenceHandler.getStoryXP();
            return xp === undefined || xp === 0;
        }
    }),

    // ------------------- private properties -------------------

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

    _getLocalAndPersonalInventories() {
        const yourItems = this.persistenceHandler.getStoryInventoryItems();
        const roomItems = this.storyCore.getRoomInventory();

        return yourItems.concat(roomItems);
    },

    /* ----------------------- public methods --------------------
       ------ these are also the commands the user can type ----- */

    hi: aliasMethod('hello'),
    sup: aliasMethod('hello'),
    hello() {
        const helloResponses = [
            'Howdy.',
            'What\'s up.',
            'How\'s it going?',
            'Salutations.',
            'Why hello there.',
            'Oh hai.'
        ];
        this.inputProcessor.handleFunctionFromApp([environmentHelpers.getRandomResponseFromList(helloResponses)]);
    },

    walk: aliasMethod('go'),
    move: aliasMethod('go'),
    go() {
        // handle no params
        if (isEmpty(this.inputProcessor.currentArgs)) {
            this.inputProcessor.handleFunctionFromApp(['Which way do you want to go?']);
            return;
        }

        // see if user entered a direction
        const chosenDirection = this._parseDirectionFromEntries(this.inputProcessor.currentArgs);

        // if it's a valid direction, update position
        if (this.storyCore.isValidDirection(chosenDirection)) {
            this.storyCore.handlePositionChange(chosenDirection);
            this.inputProcessor.handleFunctionFromApp(this.storyCore.getCurrentRoomDescription());
        } else {
            this.inputProcessor.handleFunctionFromApp(['you can\'t go that way.']);
        }
    },

    exits() {
        this.inputProcessor.handleFunctionFromApp([this.storyCore.getExitDescriptions()]);
    },

    inventory: aliasMethod('list'),
    list() {
        const yourItems = this.persistenceHandler.getStoryInventoryItems();

        if (yourItems.length === 0) {
            this.inputProcessor.handleFunctionFromApp(['You don\'t have anything.']);
            return;
        }

        const inventoryResponse = ['You\'ve got:'];

        yourItems.forEach((currItem) => {
            inventoryResponse.push(this.storyCore.getItemNameById(currItem));
        });

        this.inputProcessor.handleFunctionFromApp(inventoryResponse);
    },

    get: aliasMethod('take'),
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
                this.inputProcessor.handleFunctionFromApp([`I don't know what a ${targetItemName} is.`]);
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to take?`]);
            }
        }
    },

    discard: aliasMethod('drop'),
    drop() {
        const args = this.inputProcessor.currentArgs;

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
            // report to user
            this.inputProcessor.handleFunctionFromApp([`You drop the ${targetItemName}`]);
        } else {
            if(isPresent(targetItemName)) {
                this.inputProcessor.handleFunctionFromApp([`You don't have a ${targetItemName}.`]);
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to drop?`]);
            }
        }
    },

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
                this.inputProcessor.handleFunctionFromApp([`You don't know how to use the ${targetItemName}.`]);
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to use?`]);
            }
        }
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

    where: aliasMethod('look'),
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
        this.inputProcessor.handleFunctionFromApp([`User XP: ${this.persistenceHandler.getStoryXP()}`]);
    },

    report() {
        this.storyCore.reportStoryData();
        this.inputProcessor.handleFunctionFromApp(['Processing report...', 'Done.', '', 'See console.']);
    },

    progress: aliasMethod('status'),
    status() {
        // get max XP:
        const maxXp = this.storyCore.getMaxPossibleXp();
        const currXp = this.persistenceHandler.getStoryXP();
        const completionRatio = currXp / maxXp;

        // deaths:
        const deathCount = this.persistenceHandler.getStoryDeaths();

        // -2 here for initial and end pipes
        const maxChars = this.inputProcessor.maxCharsPerLine - 2;
        const completedChars = Math.floor(completionRatio * maxChars);

        // create ASCII graph
        let returnString = '|'.concat('|'.padStart(completedChars - 1, '=').padEnd(maxChars - 2, '-').concat('|'));

        // result
        const result = [`XP: ${currXp}`, returnString, `Deaths: ${deathCount}`];
        if (completionRatio === 1) {
            result.push('You are the Champion of the Universe!');
        }
        this.inputProcessor.handleFunctionFromApp(result);
    },

    formatStoryData() {
        // resets story
        this.storyCore.formatStoryData();
        this.inputProcessor.handleFunctionFromApp([this.welcomeMessage].concat(this.storyCore.getCurrentRoomDescription()));
    }
});
