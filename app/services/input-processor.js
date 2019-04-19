import { set } from '@ember/object';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import { normalizeEvent } from 'ember-jquery-legacy';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import environmentValues from '../const/environment-values';
import keyFunctions from './input-processor-key-functions';

export default keyFunctions.extend({

    // ------------------- private methods -------------------

    _startPromptCursorLoop() {
        const scope = this;
        set(this, 'cursorLoopContainer', setInterval(function() {
            // check for focus
            if (scope._getIsKeyboardActive()) {
                set(scope, 'isPromptCursorVisible', !scope.isPromptCursorVisible);
                if (scope.isPromptCursorVisible && scope.forceDisplayCursor) {
                    set(scope, 'forceDisplayCursor', false);
                }
            } else {
                set(scope, 'isPromptCursorVisible', false);
            }
        }, 500));
    },

    _getIsKeyboardActive() {
        const isViewerActiveDiv = document.activeElement === this.relevantMarkup;
        return isViewerActiveDiv;
    },

    _doAnalytics() {
        if (typeof window.ga !== 'function') { return; }
        const username = this.persistenceHandler.getUsername();

        window.ga('send',
            'event',
            `${username} | ${this.PROMPT_LINE_2}`,
            this.currentCommand || 'n/a'
        );
    },

    _setPreviousExecutionBlocks() {
        const currBlockCopy = Object.assign([],this.currExecutionBlock.map((currLine) => {
            // remove current block demarcation
            if (currLine.indexOf(this.CURRENT_BLOCK_DEMARCATION()) === 0) {
                return currLine.split(this.CURRENT_BLOCK_DEMARCATION())[1];
            }
            return currLine;
        }));
        const allBlocks = this.previousExecutionBlocks.concat(currBlockCopy).concat(['']);
        set(this, 'previousExecutionBlocks', allBlocks);
    },

    _execute() {
        // store command in history if it's not just whitespace
        const commandWithNoWhitespace = this.currentCommand.replace(/^\s+/, '').replace(/\s+$/, '');
        if (commandWithNoWhitespace !== '') {
            this.commandHistory.unshift(this.currentCommand);
        }
        
        // reset cursor position
        set(this, 'cursorPosition', 0);

        // kill cursor
        set(this, 'forceDisplayCursor', false);
        set(this, 'isPromptCursorVisible', false);

        // store execution block in block history
        this._setPreviousExecutionBlocks();

        // create executable command from string
        set(this, 'currentCommand', this.currentCommand.toLowerCase());
        const commandComponents = this.currentCommand.split(' ');
        const enteredWords = commandComponents.concat();
        let commandName = commandComponents[0];
        const args = commandComponents.splice(1);
        set(this, 'currentArgs', args);

        // trim accidental white space from beginning of command entry
        if (commandName === '' && args.length > 0) {
            commandName = args.shift();
        }

        this._doAnalytics();

        if (this._commandHasSwears(enteredWords)) {
            this._handleFilthyInput();
            return;
        }

        // find command
        if (isPresent(this.overrideScope)) {
            // if command is at app scope, find it
            if (isPresent(this.overrideScope[commandName])) {
                this.overrideScope[commandName]();
            } else {

                // handle ?
                if (commandName === '?') {
                    this.overrideScope['help']();
                    return;
                }

                this._handleInvalidInput(commandName.toUpperCase());
            }
        } else {
            const matchedCommand = commandRegistry.getMatchingCommand(commandName);

            // execute command if it exists
            if (isPresent(matchedCommand)) {
                this._handleCommandExecution(matchedCommand);
            } else {
                this._handleInvalidInput(commandName);
            }
        }
    },

    _commandHasSwears(enteredWords) {
        for (let i = 0; i < enteredWords.length; i++) {
            const currEnteredWord = enteredWords[i];
            if (environmentValues.badWords.includes(currEnteredWord)) {
                return true;
            }
        }

        return false;
    },

    _handleCommandExecution(commandDefinition) {
        // run app route
        getOwner(this).lookup('router:main').transitionTo(commandDefinition.routeName);
    },

    _handleFilthyInput() {
        set(this, 'currentCommand', '');
        set(this, 'currentArgs', undefined);
        
        const responsesToFilth = [
            'I may be software, but that\'s no excuse to be rude.',
            'Profanity overheats my CPU. Please be cool.',
            'Potty fingers.',
            'There\'s just no need for such language.',
            'Your word choice has been recorded in my personality profile processor.',
            'Keep talking like that and I\'ll disconnect.'
        ];

        set(this, 'appResponse', [environmentHelpers.getRandomResponseFromList(responsesToFilth)]);
    },

    _handleInvalidInput(appName) {
        set(this, 'currentCommand', '');
        set(this, 'currentArgs', undefined);

        if (isPresent(appName)) {
            set(this, 'appResponse', [`ERROR: ${appName}: command not found.`]);
            return;
        }

        set(this, 'appResponse', ['enter something']);
    },

    _handleAppKeyOverrides(entry) {
        for (let i in this.keyOverrides) {
            const currOverride = i;
            if (entry === currOverride) {
                // execute override
                this.keyOverrides[currOverride](this.overrideScope);

                // tell key processor to stop
                return true;
            }
        }
        
        // no override
        return false;
    },

    _resetInput() {
        set(this, 'currentCommand', '');
        set(this, 'currentArgs', undefined);
        set(this, 'cursorPosition', 0);
        getOwner(this).lookup('router:main').transitionTo('index');
    },

    // ------------------- public methods -------------------

    setAppEnvironment(appEnvironment) {
        set(this, 'activeApp', appEnvironment.activeAppName);
        set(this, 'appResponse', appEnvironment.response);
        set(this, 'displayAppNameInPrompt', appEnvironment.displayAppNameInPrompt);
        set(this, 'interruptPrompt', appEnvironment.interruptPrompt);
        set(this, 'keyOverrides', appEnvironment.keyOverrides);
        set(this, 'overrideScope', appEnvironment.overrideScope);

        this._resetInput();
    },

    quit() {
        set(this, 'activeApp', undefined);
        set(this, 'displayAppNameInPrompt', undefined);
        set(this, 'interruptPrompt', undefined);
        set(this, 'keyOverrides', undefined);
        set(this, 'bgImage', undefined);
        set(this, 'overrideScope', undefined);

        this._resetInput();
    },

    clear() {
        set(this, 'previousExecutionBlocks', []);
        set(this, 'appResponse', []);

        this._resetInput();
    },

    handleFunctionFromApp(response) {
        set(this, 'currentCommand', '');
        set(this, 'currentArgs', undefined);
        set(this, 'appResponse', response);
    },

    overrideArgs(newArgs) {
        set(this, 'currentArgs', newArgs);
    },

    processKey(keyEvent) {
        const entry = keyEvent.key.toUpperCase();

        // check for app based key overrides
        if (this._handleAppKeyOverrides(entry)) {
            return;
        }

        switch(entry) {
            case 'F1':
            case 'F2':
            case 'F3':
            case 'F4':
            case 'F5':
            case 'F6':
            case 'F7':
            case 'F8':
            case 'F9':
            case 'F10':
            case 'F11':
            case 'F12':
            case 'ALT':
            case 'AUDIOVOLUMEUP':
            case 'AUDIOVOLUMEDOWN':
            case 'AUDIOVOLUMEMUTE':
            case 'CAPSLOCK':
            case 'CLEAR':
            case 'CONTROL':
            case 'INSERT':
            case 'NUMLOCK':
            case 'META':
            case 'PAUSE':
            case 'SCROLLLOCK':
            case 'SHIFT':
                // ignore the above keystrokes
                break;
            case 'TAB':
                this.handleTab(keyEvent);
                break;

            case 'ARROWUP':
                this.arrowUp();
                break;

            case 'ARROWDOWN':
                this.arrowDown();
                break;

            case 'PAGEUP':
            case 'HOME':
                this.toHome();
                break;

            case 'PAGEDOWN':
            case 'END':
                this.toEnd();
                break;

            case 'ARROWLEFT':
                this.arrowLeft();
                break;

            case 'ARROWRIGHT':
                this.arrowRight();
                break;

            case 'DELETE':
                this.delete();                
                break;

            case 'BACKSPACE':
                this.backspace();
                break;

            case 'ENTER':
                this._execute();
                break;

            default:
                if (this.interruptPrompt && isPresent(this.activeApp)) {
                    // quit running app
                    if (entry === 'ESCAPE' ||
                        entry === 'C' && keyEvent.ctrlKey === true) {
                        this.quit();

                        return;
                    }
                } else {
                    // ignore input
                    if (entry === 'ESCAPE') {
                        return;
                    }
                }

                this.addKeyToCommand(keyEvent);

                // kill key event
                normalizeEvent(keyEvent).preventDefault();
                break;
        }
    }
});
