import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import environmentValues from '../constants/environment-values';
import items from '../constants/story-items';
import storyCore from '../utils/storyCore';
import persistence from '../hooks/usePersistence';

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function CmdOrigin() {
    const inputProcessor = useOutletContext();

    // Keep a fresh ref so scope methods always read the latest state/methods.
    const inputProcessorRef = useRef(null);
    inputProcessorRef.current = inputProcessor;

    useEffect(() => {

        // ---- private helpers -----------------------------------------------

        function getLocalAndPersonalInventories() {
            const yourItems = persistence.getStoryInventoryItems();
            const roomItems = storyCore.getRoomInventory();
            return yourItems.concat(roomItems);
        }

        function getItemArticle(itemName) {
            const firstLetter = itemName.charAt(0);
            return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter.toLowerCase()) ? 'an' : 'a';
        }

        function parseDirectionFromEntries(entries) {
            let chosenDirection = null;
            for (let i = 0; i < entries.length; i++) {
                const currArg = entries[i];
                for (let j = 0; j < environmentValues.exitPossibilities.length; j++) {
                    const currExit = environmentValues.exitPossibilities[j];
                    if (currArg.toUpperCase() === currExit.abbr ||
                        currArg.toUpperCase() === currExit.word) {
                        chosenDirection = currExit;
                    }
                }
            }
            return chosenDirection;
        }

        function handlePotentiallyFatalMistake(roomOverride) {
            const isInSpace = storyCore.getIsRoomInSpace(roomOverride);
            if (isInSpace && !persistence.getStoryInventoryItems().includes(15)) {
                inputProcessorRef.current.handleFunctionFromApp([
                    'You clutch your throat as all the air rushes out of your lungs and you feel like you\'re being pulled inside out. Outer space is a dangerous place. You die quickly.'
                ]);
                storyCore.handleDeath();
                return true;
            }
            return false;
        }

        function showFlashlightStatus() {
            const lightStatus = persistence.getFlashlightStatus();
            if (storyCore.hasFlashlight()) {
                const power = lightStatus.batteryLevel < 1
                    ? 'Dead'
                    : lightStatus.isOn ? 'On' : 'Off';
                return [
                    `Flashlight power: ${power}`,
                    '',
                    'Flashlight battery level:',
                    makeAsciiProgressBar(lightStatus.batteryLevel, environmentValues.FLASHLIGHT_BATTERY_FULL),
                    ''
                ];
            }
            return [];
        }

        function makeAsciiProgressBar(curr, max) {
            const completionRatio = curr / max;
            const subtractAmount = completionRatio === 1 ? 3 : 2;
            const maxChars = inputProcessorRef.current.state.maxCharsPerLine - subtractAmount;
            const completedChars = Math.floor(completionRatio * maxChars);
            return '|'.concat(
                '|'.padStart(completedChars - 1, '=').padEnd(maxChars - 2, '-').concat('|')
            );
        }

        // Internal helpers that accept args directly, avoiding state mutation issues.
        // (Ember mutated currentArgs in pick(); React state can't be mutated.)

        function _take(args) {
            const targetItemName = args[0] === 'the' ? args[1] : args[0];
            const roomItems = storyCore.getRoomInventory();
            const targetItemId = storyCore.getItemIdByName(targetItemName);

            if (targetItemId != null && roomItems.includes(targetItemId)) {
                if (storyCore.canTakeItem(targetItemId)) {
                    persistence.removeItemFromRoom(storyCore.getCurrentRoomId(), targetItemId);
                    persistence.addStoryInventoryItem(targetItemId);
                    inputProcessorRef.current.handleFunctionFromApp([`You take the ${targetItemName}`]);
                } else {
                    inputProcessorRef.current.handleFunctionFromApp([`The ${targetItemName} is too heavy.`]);
                }
            } else {
                if (targetItemName != null) {
                    if (persistence.getStoryInventoryItems().includes(targetItemId)) {
                        inputProcessorRef.current.handleFunctionFromApp([`You already have the ${targetItemName}.`]);
                    } else {
                        inputProcessorRef.current.handleFunctionFromApp([`I don't know what a ${targetItemName} is.`]);
                    }
                } else {
                    inputProcessorRef.current.handleFunctionFromApp([`What do you want to take?`]);
                }
            }
            handlePotentiallyFatalMistake();
        }

        function _use(args) {
            const targetItemName = args[0] === 'the' ? args[1] : args[0];
            const localInventories = getLocalAndPersonalInventories();
            const targetItemId = storyCore.getItemIdByName(targetItemName);
            const itemType = storyCore.getItemTypeById(targetItemId);

            if (localInventories.includes(targetItemId) &&
                itemType === environmentValues.ITEM_TYPE_THING) {
                inputProcessorRef.current.handleFunctionFromApp(
                    storyCore.useItem(targetItemId, args)
                );
            } else {
                if (targetItemName != null) {
                    inputProcessorRef.current.handleFunctionFromApp([`You don't have a ${targetItemName}.`]);
                } else {
                    inputProcessorRef.current.handleFunctionFromApp([`What do you want to use?`]);
                }
            }
        }

        // ---- scope object (overrideScope) ----------------------------------
        // All methods read args from inputProcessorRef.current.state at call time.

        const scope = {

            // --- from FunCtionality mixin ---

            hi() { scope.hello(); },
            sup() { scope.hello(); },
            hello() {
                const helloResponses = [
                    'Howdy.',
                    'What\'s up.',
                    'How\'s it going?',
                    'Salutations.',
                    'Why hello there.',
                    'Oh hai.'
                ];
                inputProcessorRef.current.handleFunctionFromApp([
                    environmentHelpers.getRandomResponseFromList(helloResponses)
                ]);
            },

            dig() {
                inputProcessorRef.current.handleFunctionFromApp([
                    'You don\'t have any tools for digging, and you are not into digging with your bare hands.'
                ]);
            },

            destroy() { scope.smash(); },
            smash() {
                const args = inputProcessorRef.current.state.currentArgs;
                const targetItemName = args[0] === 'the' ? args[1] : args[0];
                const targetItemId = storyCore.getItemIdByName(targetItemName);
                const localInventories = getLocalAndPersonalInventories();

                if (targetItemName == null || targetItemName === '') {
                    inputProcessorRef.current.handleFunctionFromApp(['What do you want to smash?']);
                    return;
                }

                if (localInventories.includes(targetItemId)) {
                    inputProcessorRef.current.handleFunctionFromApp([
                        `You're like RAAAAAA and you smash the ${targetItemName} real hard. You wish you were a giant robot though 'cause nothing really happens - you weren't cut out for smashing.`
                    ]);
                } else {
                    inputProcessorRef.current.handleFunctionFromApp([
                        `You don't see ${getItemArticle(targetItemName)} ${targetItemName} to smash.`
                    ]);
                }
            },

            wave() {
                const args = inputProcessorRef.current.state.currentArgs;
                let responseObjectName = '';

                if (args[0] === 'to' || args[0] === 'at') {
                    responseObjectName = args[1] === 'the' ? args[2] : args[1];
                }

                const response = (responseObjectName != null && responseObjectName !== '')
                    ? `You wave at the ${responseObjectName}. It doesn't wave back. You're a little disappointed but you were also kind of expecting it.`
                    : 'You wave your hand back and forth above your head.';

                inputProcessorRef.current.handleFunctionFromApp([response]);
            },

            stab() { scope.kill(); },
            attack() { scope.kill(); },
            kill() {
                const args = inputProcessorRef.current.state.currentArgs;
                const targetItemName = args[0] === 'the' ? args[1] : args[0];
                const localInventories = getLocalAndPersonalInventories();
                const targetItemId = storyCore.getItemIdByName(targetItemName);

                if (targetItemName == null || targetItemName === '') {
                    inputProcessorRef.current.handleFunctionFromApp(['What do you want to attack?']);
                    return;
                }

                if (targetItemName === 'robot' && storyCore.getCurrentRoomId() === 10) {
                    const attackRobotResponses = [
                        'Seriously? It\'s a robot the size of a building. Don\'t be ridiculous.',
                        'Hahahahah what are you gonna destroy it with harsh language? Stop it.',
                        'You settle into your fighting stance and then immediately think better of your decision to go on the offensive. You actually feel pretty silly for even having considered it. Look at this thing.'
                    ];
                    inputProcessorRef.current.handleFunctionFromApp([
                        environmentHelpers.getRandomResponseFromList(attackRobotResponses)
                    ]);
                } else if (['yourself', 'self'].includes(targetItemName)) {
                    inputProcessorRef.current.handleFunctionFromApp(['Come on now it\'s not that bad.']);
                } else if (['alien', 'aliens'].includes(targetItemName) &&
                           [13, 27].includes(storyCore.getCurrentRoomId())) {
                    inputProcessorRef.current.handleFunctionFromApp(storyCore.attackAlien());
                } else if (['ducks', 'geese', 'fish'].includes(targetItemName) &&
                           storyCore.getCurrentRoomId() === 2) {
                    inputProcessorRef.current.handleFunctionFromApp(['That would just be cruel.']);
                } else if (localInventories.includes(targetItemId)) {
                    inputProcessorRef.current.handleFunctionFromApp([
                        `You fling yourself at the ${targetItemName} and immediately discover that you've played too many videogames because you just fall down and vow to make better decisions in the future as you dust yourself off and lift yourself off the floor.`,
                        `The ${targetItemName} is unaffected.`
                    ]);
                } else {
                    inputProcessorRef.current.handleFunctionFromApp([
                        `Try talking like that when there's ${getItemArticle(targetItemName)} ${targetItemName} around.`
                    ]);
                }
            },

            feed() {
                const args = inputProcessorRef.current.state.currentArgs;
                const targetItemName = args[0] === 'the'
                    ? args[1].toLowerCase()
                    : args[0].toLowerCase();
                const currentRoomId = storyCore.getCurrentRoomId();

                if (currentRoomId === 2) {
                    if (['ducks', 'geese', 'fish'].includes(targetItemName)) {
                        inputProcessorRef.current.handleFunctionFromApp(storyCore.feedDucks());
                        return;
                    }
                }
                if (currentRoomId === 10) {
                    if (targetItemName === 'robot') {
                        inputProcessorRef.current.handleFunctionFromApp(storyCore.feedRobot());
                        return;
                    }
                }
                if (currentRoomId === 13 || currentRoomId === 27) {
                    if (targetItemName === 'alien' || targetItemName === 'aliens') {
                        inputProcessorRef.current.handleFunctionFromApp(storyCore.feedAliens());
                        return;
                    }
                }
                inputProcessorRef.current.handleFunctionFromApp([
                    `That's very nice of you but you can't feed the ${targetItemName}.`
                ]);
            },

            eat() {
                const args = inputProcessorRef.current.state.currentArgs;
                const targetItemName = args[0] === 'the' ? args[1] : args[0];
                const localInventories = getLocalAndPersonalInventories();
                const targetItemId = storyCore.getItemIdByName(targetItemName);
                const itemType = storyCore.getItemTypeById(targetItemId);

                if (localInventories.includes(targetItemId) &&
                    itemType === environmentValues.ITEM_TYPE_FOOD) {
                    inputProcessorRef.current.handleFunctionFromApp(storyCore.eatObject(targetItemId));
                } else {
                    if (targetItemName != null) {
                        if (localInventories.includes(targetItemId) && targetItemId === 11) {
                            if (storyCore.getIsRoomInSpace()) {
                                inputProcessorRef.current.handleFunctionFromApp(storyCore.eatCake());
                            } else {
                                inputProcessorRef.current.handleFunctionFromApp([
                                    'You try to lift the cover to get at the cake, but it seems to be powerfully sealed on there. You even try smashing the glass with a rock - it holds fast. This is no ordinary cake display. Your curiosity about the nature of the cake becomes more powerful than your hunger to eat it.'
                                ]);
                            }
                        } else if (localInventories.includes(targetItemId)) {
                            inputProcessorRef.current.handleFunctionFromApp([
                                `You can't eat a ${targetItemName}. That would be crazy.`
                            ]);
                        } else {
                            inputProcessorRef.current.handleFunctionFromApp([
                                `If you had a ${targetItemName}, you'd eat it. But you don't have a ${targetItemName}.`
                            ]);
                        }
                    } else {
                        inputProcessorRef.current.handleFunctionFromApp([`What do you want to eat?`]);
                    }
                }
            },

            drink() {
                const args = inputProcessorRef.current.state.currentArgs;
                const targetItemName = args[0] === 'the' ? args[1] : args[0];
                const localInventories = getLocalAndPersonalInventories();
                const targetItemId = storyCore.getItemIdByName(targetItemName);
                const itemType = storyCore.getItemTypeById(targetItemId);

                if (localInventories.includes(targetItemId) &&
                    itemType === environmentValues.ITEM_TYPE_DRINK) {
                    inputProcessorRef.current.handleFunctionFromApp(storyCore.drinkObject(targetItemId));
                } else {
                    if (targetItemName != null) {
                        if (localInventories.includes(targetItemId) && targetItemId === 16) {
                            inputProcessorRef.current.handleFunctionFromApp(storyCore.drinkPoison(targetItemId));
                        } else if (localInventories.includes(targetItemId)) {
                            inputProcessorRef.current.handleFunctionFromApp([
                                `You can't drink ${targetItemName}. That's preposterous.`
                            ]);
                        } else {
                            inputProcessorRef.current.handleFunctionFromApp([
                                `If you had some ${targetItemName}, you'd drink it. But you don't have any ${targetItemName}.`
                            ]);
                        }
                    } else {
                        inputProcessorRef.current.handleFunctionFromApp([`What do you want to drink?`]);
                    }
                }
            },

            // --- from cmd-origin route ---

            walk() { scope.go(); },
            move() { scope.go(); },
            go() {
                const args = inputProcessorRef.current.state.currentArgs;

                if (!args || args.length === 0) {
                    inputProcessorRef.current.handleFunctionFromApp(['Which way do you want to go?']);
                    return;
                }

                const chosenDirection = parseDirectionFromEntries(args);

                if (chosenDirection == null) {
                    inputProcessorRef.current.handleFunctionFromApp(['Please enter a valid direction to go in.']);
                    return;
                }

                if (storyCore.isValidDirection(chosenDirection)) {
                    const nextRoomInfo = storyCore.getNextRoomInfo(chosenDirection);

                    if (handlePotentiallyFatalMistake(nextRoomInfo.nextRoom)) {
                        return;
                    }

                    storyCore.handlePositionChange(nextRoomInfo);
                    inputProcessorRef.current.handleFunctionFromApp(storyCore.getCurrentRoomDescription());
                } else {
                    inputProcessorRef.current.handleFunctionFromApp(['you can\'t go that way.']);
                }
            },

            exits() {
                inputProcessorRef.current.handleFunctionFromApp([storyCore.getExitDescriptions()]);
            },

            items() { scope.list(); },
            inventory() { scope.list(); },
            list() {
                const yourItems = persistence.getStoryInventoryItems();

                if (yourItems.length === 0) {
                    inputProcessorRef.current.handleFunctionFromApp(['You don\'t have anything.']);
                    return;
                }

                const curr = storyCore.getWeightOfUserInventory();
                const weightStats = `[${curr}/${environmentValues.WEIGHT_CAPACITY}]`;
                const inventoryResponse = [`You're carrying ${weightStats}:`];

                yourItems.forEach((currItem) => {
                    inventoryResponse.push(` - ${storyCore.getItemNameById(currItem)}`);
                });

                inputProcessorRef.current.handleFunctionFromApp(inventoryResponse);
            },

            pick() {
                const args = inputProcessorRef.current.state.currentArgs;
                if (args[0] === 'up') {
                    // "pick up X" → take X (skip the 'up' arg without mutating state)
                    _take(args.slice(1));
                } else {
                    inputProcessorRef.current.handleFunctionFromApp([`What do you want to pick up?`]);
                }
            },

            get() { scope.take(); },
            take() {
                _take(inputProcessorRef.current.state.currentArgs);
            },

            throw() { scope.drop(true); },
            discard() { scope.drop(); },
            drop(isThrow) {
                const args = inputProcessorRef.current.state.currentArgs;
                const actionWord = isThrow ? 'throw' : 'drop';
                const targetItemName = args[0] === 'the' ? args[1] : args[0];
                const userInventory = persistence.getStoryInventoryItems();
                const targetItemId = storyCore.getItemIdByName(targetItemName);

                if (userInventory.includes(targetItemId)) {
                    persistence.addItemToRoom(storyCore.getCurrentRoomId(), targetItemId);
                    persistence.removeStoryInventoryItem(targetItemId);

                    if (targetItemId === 7) {
                        storyCore.turnOffFlashlight();
                    }

                    const response = [`You ${actionWord} the ${targetItemName}`];
                    if (isThrow) {
                        response.push('');
                        response.push('It doesn\'t go very far. You feel a little silly.');
                    }
                    inputProcessorRef.current.handleFunctionFromApp(response);
                } else {
                    if (targetItemName != null) {
                        inputProcessorRef.current.handleFunctionFromApp([
                            `You don't have a ${targetItemName}.`
                        ]);
                    } else {
                        inputProcessorRef.current.handleFunctionFromApp([
                            `What do you want to ${actionWord}?`
                        ]);
                    }
                }

                handlePotentiallyFatalMistake();
            },

            inspect() { scope.examine(); },
            examine(passedArgs) {
                const theArgs = passedArgs || inputProcessorRef.current.state.currentArgs;
                const objectName = theArgs[0] === 'the' ? theArgs[1] : theArgs[0];
                const localInventories = getLocalAndPersonalInventories();
                const objectId = storyCore.getItemIdByName(objectName);

                if (objectId != null && localInventories.includes(objectId)) {
                    const itemDescription = storyCore.getItemDetailsById(objectId);
                    inputProcessorRef.current.handleFunctionFromApp([itemDescription]);
                } else {
                    if (objectName != null) {
                        inputProcessorRef.current.handleFunctionFromApp([
                            `You can't learn anything more about ${objectName} by examining it.`
                        ]);
                    } else {
                        inputProcessorRef.current.handleFunctionFromApp([`What do you want to examine?`]);
                    }
                }
            },

            talk() {
                const args = inputProcessorRef.current.state.currentArgs;
                let responseObjectName = 'that';

                if (args[0] === 'to') {
                    responseObjectName = args[1] === 'the' ? args[2] : args[1];
                    if (responseObjectName === 'robot') {
                        // overrideArgs(['robot']) → use(['robot']) without state round-trip
                        _use(['robot']);
                        return;
                    }
                }

                inputProcessorRef.current.handleFunctionFromApp([
                    `You don't know how to talk to ${responseObjectName}.`
                ]);
            },

            turn() {
                const args = inputProcessorRef.current.state.currentArgs;
                const firstArg = args[0];

                if (firstArg === 'on' || firstArg === 'off') {
                    // remove on/off from args, append as last arg
                    const argsMinusFirst = args.slice(1).concat([firstArg]);
                    _use(argsMinusFirst);
                    return;
                } else if (firstArg === 'flashlight') {
                    _use(args);
                    return;
                }

                inputProcessorRef.current.handleFunctionFromApp([
                    `ERROR: I do not understand turn ${firstArg}`
                ]);
            },

            use() {
                _use(inputProcessorRef.current.state.currentArgs);
            },

            give() {
                const args = inputProcessorRef.current.state.currentArgs;
                const targetItemName = args[0];
                const operator = args[1];
                const recipientName = args[2] === 'the' ? args[3] : args[2];
                const yourItems = persistence.getStoryInventoryItems();
                const targetItemId = storyCore.getItemIdByName(targetItemName);
                const currRoom = storyCore.getCurrentRoomId();

                if (targetItemId == null || targetItemId === '') {
                    inputProcessorRef.current.handleFunctionFromApp([`What's a ${targetItemName}?`]);
                    return;
                }

                if (!yourItems.includes(targetItemId)) {
                    inputProcessorRef.current.handleFunctionFromApp([
                        `You don't have a ${targetItemName}`
                    ]);
                    return;
                }

                if (operator === 'to') {
                    if (recipientName == null || recipientName === '') {
                        inputProcessorRef.current.handleFunctionFromApp([
                            `Who do you want to give the ${targetItemName} to?`
                        ]);
                        return;
                    }

                    if (recipientName.toUpperCase() === 'ROBOT') {
                        if (currRoom === 10) {
                            if (environmentValues.COMPLETION_ITEM_IDS.includes(targetItemId)) {
                                inputProcessorRef.current.handleFunctionFromApp(
                                    storyCore.handleCompletionEvent(targetItemId)
                                );
                                return;
                            }
                            inputProcessorRef.current.handleFunctionFromApp([
                                `The robot doesn't need a ${targetItemName}.`
                            ]);
                            return;
                        } else {
                            inputProcessorRef.current.handleFunctionFromApp([
                                `You aren't with the robot, so you can't give it the ${targetItemName}.`
                            ]);
                            return;
                        }
                    }

                    inputProcessorRef.current.handleFunctionFromApp([
                        `You can't give the ${targetItemName} to the ${recipientName}.`
                    ]);
                    return;
                }

                if (targetItemName != null) {
                    inputProcessorRef.current.handleFunctionFromApp([
                        `Who do you want to give the ${targetItemName} to?`
                    ]);
                    return;
                }

                inputProcessorRef.current.handleFunctionFromApp([`What do you want to give?`]);
            },

            read() {
                const args = inputProcessorRef.current.state.currentArgs;
                const targetItemName = args[0] === 'the' ? args[1] : args[0];
                const localInventories = getLocalAndPersonalInventories();
                const targetItemId = storyCore.getItemIdByName(targetItemName);
                const itemType = storyCore.getItemTypeById(targetItemId);

                if (localInventories.includes(targetItemId) &&
                    itemType === environmentValues.ITEM_TYPE_DOC) {
                    inputProcessorRef.current.handleFunctionFromApp(
                        storyCore.readDocument(targetItemId)
                    );
                } else {
                    if (targetItemName != null) {
                        inputProcessorRef.current.handleFunctionFromApp([
                            `The ${targetItemName} isn't a thing that you read.`
                        ]);
                    } else {
                        inputProcessorRef.current.handleFunctionFromApp([`What do you want to read?`]);
                    }
                }
            },

            where() {
                inputProcessorRef.current.handleFunctionFromApp(storyCore.whereAmI());
            },

            surroundings() { scope.look(); },
            look() {
                const args = inputProcessorRef.current.state.currentArgs;

                if (args != null && args.length > 0) {
                    const chosenDirection = parseDirectionFromEntries(args);

                    if (args[0] === 'at') {
                        scope.examine(args.slice(1));
                    } else if (chosenDirection != null) {
                        inputProcessorRef.current.handleFunctionFromApp(
                            storyCore.getDescriptionInDirection(chosenDirection)
                        );
                    } else {
                        inputProcessorRef.current.handleFunctionFromApp(
                            storyCore.getFullRoomDescription()
                        );
                    }
                } else {
                    inputProcessorRef.current.handleFunctionFromApp(
                        storyCore.getFullRoomDescription()
                    );
                }
            },

            save() {
                inputProcessorRef.current.handleFunctionFromApp([
                    'Story progress is auto-saved to local client, no need to manually save.  But I like that you care.'
                ]);
            },

            xp() {
                inputProcessorRef.current.handleFunctionFromApp([
                    `Your XP: ${storyCore.getXp()} / ${storyCore.getMaxXp()}`
                ]);
            },

            report() {
                storyCore.reportStoryData();
                inputProcessorRef.current.handleFunctionFromApp([
                    'Processing report...', 'Done.', '', 'See console.'
                ]);
            },

            progress() { scope.status(); },
            status() {
                let result = showFlashlightStatus();

                const maxXp = storyCore.getMaxXp();
                const currXp = storyCore.getXp();
                const deathCount = persistence.getStoryDeaths();
                let barProgress = makeAsciiProgressBar(currXp, maxXp);

                const isHacker = persistence.getAllUnlockedItems().includes(1);
                const hackerReport = isHacker ? ['', 'Hacker Status:', ' [x] hacker'] : [];

                const completionReport = [];
                const hasUnlockedRobot = persistence.getAllUnlockedItems().includes(10);

                if (hasUnlockedRobot) {
                    const hasCompletedGame = storyCore._getIsGameCompleted();
                    completionReport.push('');

                    if (hasCompletedGame) {
                        completionReport.push('You have totally saved the world.  Nice work.');
                        completionReport.push(' [x] self satisfaction, relief');
                    } else {
                        completionReport.push('Robot\'s Quest:');
                        const collectedCompletionItems = persistence.getStoryCompletionItemsCollected();
                        environmentValues.COMPLETION_ITEM_IDS.forEach((currCompletionId) => {
                            const itemObtained = collectedCompletionItems.includes(currCompletionId);
                            const itemName = items.getItemById(currCompletionId).name;
                            completionReport.push(` [${itemObtained ? 'x' : ' '}] ${itemName}`);
                        });
                    }
                }

                const isExplorer = maxXp === currXp;
                if (isExplorer) {
                    result.push('');
                    result.push('You really get around.');
                    result.push(' [x] explorer');
                } else {
                    result = result.concat(['Explorer:', barProgress]);
                }

                result = result.concat(hackerReport.concat(completionReport));

                if (persistence.getCakeEaten()) {
                    result.push('');
                    result.push('You ate the cake.');
                    result.push(' [x] happiness');
                }

                result.push(['', `Deaths: ${deathCount}`]);

                inputProcessorRef.current.handleFunctionFromApp(result);
            },

            format() {
                storyCore.formatStoryData();
                inputProcessorRef.current.handleFunctionFromApp(
                    [`Welcome to Origin ${persistence.getUsername()}`, '']
                        .concat(storyCore.getCurrentRoomDescription())
                );
            },

            quit() {
                inputProcessorRef.current.quit();
            },

            clear() {
                inputProcessorRef.current.clear();
            },

            help() {
                inputProcessorRef.current.handleFunctionFromApp([
                    'Origin help:',
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
                    'Have fun!'
                ]);
            },

            commandComplete(fragment) {
                const commandRegistry = [
                    'status', 'progress', 'report', 'xp', 'save', 'look', 'where',
                    'read', 'give', 'use', 'talk', 'examine', 'inspect', 'drop',
                    'discard', 'take', 'get', 'pick', 'list', 'inventory', 'items',
                    'go', 'move', 'walk', 'hello', 'sup', 'hi', 'clear', 'quit',
                    'help', 'turn', 'eat', 'drink', 'surroundings', 'wave', 'stab',
                    'attack', 'kill', 'throw', 'smash', 'destroy'
                ];
                return environmentHelpers.handleTabComplete(
                    fragment,
                    [commandRegistry, items.items.map(i => i.name)]
                );
            },
        };

        // ---- afterModel equivalent -----------------------------------------

        let welcomePrefix = 'Welcome back';

        if (storyCore.getIsNewStory()) {
            storyCore.formatStoryData();
            welcomePrefix = 'Welcome to Origin';
        }

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-origin',
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: scope,
            response: [`${welcomePrefix} ${persistence.getUsername()}`, '']
                .concat(storyCore.getCurrentRoomDescription())
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
