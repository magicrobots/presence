import Mixin from '@ember/object/mixin';
import { aliasMethod } from '@ember/object';
import { isPresent, isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';
import environmentValues from '../const/environment-values';

export default Mixin.create({
    inputProcessor: service(),
    persistenceHandler: service(),
    storyCore: service(),

    // --------------------------- private functions

    _getLocalAndPersonalInventories() {
        const yourItems = this.persistenceHandler.getStoryInventoryItems();
        const roomItems = this.storyCore.getRoomInventory();

        return yourItems.concat(roomItems);
    },

    _getItemArticle(itemName) {
        const firstLetter = itemName.charAt(0);

        return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter.toLowerCase()) ? 'an' : 'a';
    },

    // ---------------------------- public commands

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

    dig() {
        this.inputProcessor.handleFunctionFromApp(['You don\'t have any tools for digging, and you are not into digging with your bare hands.']);
    },

    destroy: aliasMethod('smash'),
    smash() {
        const args = this.inputProcessor.currentArgs;
        const targetItemName = args[0] === 'the' ? args[1] : args[0];
        const targetItemId = this.storyCore.getItemIdByName(targetItemName);
        const localInventories = this._getLocalAndPersonalInventories();

        if (isEmpty(targetItemName)) {
            this.inputProcessor.handleFunctionFromApp(['What do you want to smash?']);
            return;
        }

        if (localInventories.includes(targetItemId)) {
            this.inputProcessor.handleFunctionFromApp([`You're like RAAAAAA and you smash the ${targetItemName} real hard. You wish you were a giant robot though 'cause nothing really happens - you weren't cut out for smashing.`]);
        } else {
            this.inputProcessor.handleFunctionFromApp([`You don't see ${this._getItemArticle(targetItemName)} ${targetItemName} to smash.`]);
        }
    },

    wave() {
        const args = this.inputProcessor.currentArgs;

        let responseObjectName = '';

        if (args[0] === 'to' || args[0] === 'at') {
            responseObjectName = args[1] === 'the' ? args[2] : args[1];
        }

        const response = (isPresent(responseObjectName)) ? 
            `You wave at the ${responseObjectName}. It doesn't wave back. You're a little disappointed but you were also kind of expecting it.` :
            'You wave your hand back and forth above your head.';

        this.inputProcessor.handleFunctionFromApp([response]);
    },

    stab: aliasMethod('kill'),
    attack: aliasMethod('kill'),
    kill() {
        const args = this.inputProcessor.currentArgs;
        const targetItemName = args[0] === 'the' ? args[1] : args[0];
        const localInventories = this._getLocalAndPersonalInventories();
        const targetItemId = this.storyCore.getItemIdByName(targetItemName);

        if (isEmpty(targetItemName)) {
            this.inputProcessor.handleFunctionFromApp(['What do you want to attack?']);
            return;
        }

        if (targetItemName === 'robot' && this.storyCore.getCurrentRoomId() === 10) {
            const attackRobotResponses = [
                'Seriously? It\'s a robot the size of a building. Don\'t be ridiculous.',
                'Hahahahah what are you gonna destroy it with harsh language? Stop it.',
                'You settle into your fighting stance and then immediately think better of your decision to go on the offensive. You actually feel pretty silly for even having considered it. Look at this thing.'
                ];
            
            this.inputProcessor.handleFunctionFromApp([environmentHelpers.getRandomResponseFromList(attackRobotResponses)]);

        } else if (['yourself','self'].includes(targetItemName)) {
            this.inputProcessor.handleFunctionFromApp(['Come on now it\'s not that bad.']);

        } else if (['alien', 'aliens'].includes(targetItemName) && [13,27].includes(this.storyCore.getCurrentRoomId())) {
            this.inputProcessor.handleFunctionFromApp(this.storyCore.attackAlien());

        } else if (['ducks','geese','fish'].includes(targetItemName) && this.storyCore.getCurrentRoomId() === 2) {
            this.inputProcessor.handleFunctionFromApp(['That would just be cruel.']);

        } else if (localInventories.includes(targetItemId)) {
            this.inputProcessor.handleFunctionFromApp([`You fling yourself at the ${targetItemName} and immediately discover that you've played too many videogames because you just fall down and vow to make better decisions in the future as you dust yourself off and lift yourself off the floor.`,
                `The ${targetItemName} is unaffected.`]);

        } else {
            this.inputProcessor.handleFunctionFromApp([`Try talking like that when there's ${this._getItemArticle(targetItemName)} ${targetItemName} around.`]);
        }
    },

    feed() {
        const args = this.inputProcessor.currentArgs;

        // remove 'the' if it's in there
        const targetItemName = args[0] === 'the' ? args[1].toLowerCase() : args[0].toLowerCase();
        const currentRoomId = this.storyCore.getCurrentRoomId();
        
        // do activity based on location
        if (currentRoomId === 2) {
            // if you're by the pond you can feed the ducks.
            if (targetItemName === 'ducks' || targetItemName === 'geese' || targetItemName === 'fish') {
                this.inputProcessor.handleFunctionFromApp(this.storyCore.feedDucks());
                return;
            }
        }

        if (currentRoomId === 10) {
            // if you're on the helipad you can feed the robot
            if (targetItemName === 'robot') {
                this.inputProcessor.handleFunctionFromApp(this.storyCore.feedRobot());
                return;
            }
        }

        if (currentRoomId === 13 || currentRoomId === 27) {
            // if you're in the caves you can feed the aliens
            if (targetItemName === 'alien' || targetItemName === 'aliens') {
                this.inputProcessor.handleFunctionFromApp(this.storyCore.feedAliens());
                return;
            }
        }

        this.inputProcessor.handleFunctionFromApp([`That's very nice of you but you can't feed the ${targetItemName}.`]);
    },

    eat() {
        const args = this.inputProcessor.currentArgs;

        // remove 'the' if it's in there
        const targetItemName = args[0] === 'the' ? args[1] : args[0];
        const localInventories = this._getLocalAndPersonalInventories();
        const targetItemId = this.storyCore.getItemIdByName(targetItemName);
        const itemType = this.storyCore.getItemTypeById(targetItemId);

        // eat it
        if (localInventories.includes(targetItemId) &&
            itemType === environmentValues.ITEM_TYPE_FOOD) {
            this.inputProcessor.handleFunctionFromApp(this.storyCore.eatObject(targetItemId));
        } else {
            if(isPresent(targetItemName)) {
                // if it's the cake
                if (localInventories.includes(targetItemId) &&
                    targetItemId === 11) {
                    
                    // if you're in space you can eat the cake
                    if (this.storyCore.getIsRoomInSpace()) {
                        this.inputProcessor.handleFunctionFromApp(this.storyCore.eatCake());
                    } else {
                        this.inputProcessor.handleFunctionFromApp(['You try to lift the cover to get at the cake, but it seems to be powerfully sealed on there. You even try smashing the glass with a rock - it holds fast. This is no ordinary cake display. Your curiosity about the nature of the cake becomes more powerful than your hunger to eat it.']);
                    }
                } else if (localInventories.includes(targetItemId)) {
                    this.inputProcessor.handleFunctionFromApp([`You can't eat a ${targetItemName}. That would be crazy.`]);
                } else {
                    this.inputProcessor.handleFunctionFromApp([`If you had a ${targetItemName}, you'd eat it. But you don't have a ${targetItemName}.`]);
                }
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to eat?`]);
            }
        }
    },

    drink() {
        const args = this.inputProcessor.currentArgs;

        // remove 'the' if it's in there
        const targetItemName = args[0] === 'the' ? args[1] : args[0];
        const localInventories = this._getLocalAndPersonalInventories();
        const targetItemId = this.storyCore.getItemIdByName(targetItemName);
        const itemType = this.storyCore.getItemTypeById(targetItemId);

        // drink it
        if (localInventories.includes(targetItemId) &&
            itemType === environmentValues.ITEM_TYPE_DRINK) {
            this.inputProcessor.handleFunctionFromApp(this.storyCore.drinkObject(targetItemId));
        } else {
            if(isPresent(targetItemName)) {
                // if it's the poison
                if (localInventories.includes(targetItemId) &&
                    targetItemId === 16) {
                    this.inputProcessor.handleFunctionFromApp(this.storyCore.drinkPoison(targetItemId));
                } else if (localInventories.includes(targetItemId)) {
                    this.inputProcessor.handleFunctionFromApp([`You can't drink ${targetItemName}. That's preposterous.`]);
                } else {
                    this.inputProcessor.handleFunctionFromApp([`If you had some ${targetItemName}, you'd drink it. But you don't have any ${targetItemName}.`]);
                }
            } else {
                this.inputProcessor.handleFunctionFromApp([`What do you want to drink?`]);
            }
        }
    }
});