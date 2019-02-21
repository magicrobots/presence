import Route from '@ember/routing/route';
import { computed, aliasMethod } from '@ember/object';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

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
        this.storyCore.reportStoryData();
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
            for (let j = 0; j < this.storyCore.getExitPossibilities().length; j++ ) {
                const currExit = this.storyCore.getExitPossibilities()[j];
                if (currArg.toUpperCase() === currExit.abbr ||
                    currArg.toUpperCase() === currExit.word ) {
                        chosenDirection = currExit;
                }
            }
        }

        return chosenDirection;
    },

    _getRandomResponseFromList(list) {
        const randomResponseIndex = Math.floor(Math.random() * list.length);

        return list[randomResponseIndex];
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
        this.inputProcessor.handleFunctionFromApp([this._getRandomResponseFromList(helloResponses)]);
    },

    walk: aliasMethod('go'),
    move: aliasMethod('go'),
    go() {
        // see if user entered a direction
        const chosenDirection = this._parseDirectionFromEntries(this.inputProcessor.currentArgs);

        // if it's a valid direction, update position
        if (this.storyCore.isValidDirection(chosenDirection)) {
            this.storyCore.handlePositionChange(chosenDirection);
            this.inputProcessor.handleFunctionFromApp(this.storyCore.getCurrentRoomDescription());
        } else {
            this.inputProcessor.handleFunctionFromApp(['you can\'t go that way.']);
        }

        this.storyCore.reportStoryData();
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
                this.storyCore.reportStoryData();
            } else {
                this.inputProcessor.handleFunctionFromApp(['You can\'t take that.']);
            }
        } else {
            this.inputProcessor.handleFunctionFromApp([`I don't know what a ${targetItemName} is.`]);
        }
    },

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
            this.storyCore.reportStoryData();
        } else {
            this.inputProcessor.handleFunctionFromApp([`You don't have a ${targetItemName}.`]);
        }
    },

    examine(passedObjectName) {
        const objectName = passedObjectName || this.inputProcessor.currentArgs[0];

        // find matching item if it exists in either your or the rooms' inventories
        const yourItems = this.persistenceHandler.getStoryInventoryItems();
        const roomItems = this.storyCore.getRoomInventory();
        const localInventories = yourItems.concat(roomItems);
        const objectId = this.storyCore.getItemIdByName(objectName);

        if (isPresent(objectId) && localInventories.includes(objectId)) {
            const itemDescription = this.storyCore.getItemDetailsById(objectId);
            this.inputProcessor.handleFunctionFromApp([itemDescription]);
        } else {
            this.inputProcessor.handleFunctionFromApp([`I don't know what a ${passedObjectName} is.`]);
        }
    },

    look() {
        const args = this.inputProcessor.currentArgs;
        if (isPresent(args)) {
            const chosenDirection = this._parseDirectionFromEntries(args);
            if (args[0] === 'at') {

                // user is looking at something
                this.examine(args[1]);
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

    formatStoryData() {
        // resets story
        this.storyCore.formatStoryData();
        this.inputProcessor.handleFunctionFromApp([this.welcomeMessage].concat(this.storyCore.getCurrentRoomDescription()));
        this.storyCore.reportStoryData();
    }
});
