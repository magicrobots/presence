import { set } from '@ember/object';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import { normalizeEvent } from 'ember-jquery-legacy';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import environmentValues from '../const/environment-values';
import MagicNumbers from '../const/magic-numbers';
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
        }, MagicNumbers.CURSOR_BLINK_LENGTH));
    },

    _getIsKeyboardActive() {
        return true;
        // const isViewerActiveDiv = document.activeElement === this.relevantMarkup;
        // return isViewerActiveDiv;
    },

    _doAnalytics() {
        // if (typeof window.gtag !== 'function') { return; }
        // const username = this.persistenceHandler.getUsername();
        // const context = this.activeApp || 'root';
        // const param2 = `user: ${username} | app: ${context}`;

        // window.gtag('event', param2, {
        //     'event_category' : context,
        //     'event_label' : this.currentCommand || 'n/a',
        //   });
    },

    _setPreviousExecutionBlocks() {
        const currBlockCopy = Object.assign([],this.currExecutionBlock.map((currLine) => {
            // remove current block demarcation
            if (currLine.indexOf(this.currentBlockDemarcation()) === 0) {
                return currLine.split(this.currentBlockDemarcation())[1];
            }
            return currLine;
        }));
        const allBlocks = this.previousExecutionBlocks.concat(currBlockCopy).concat(['']);
        set(this, 'previousExecutionBlocks', allBlocks);
    },

    _execute() {
        set(this, 'currentCommand', this.currentCommand.trim());
        set(this, 'rawUserEntry', this.currentCommand);
        this._doAnalytics();

        // if it's an email message just send it
        if (this.activeApp === 'cmd-contact') {
            this.overrideScope['handleContactInput'](this.currentCommand);
            return;
        }

        // store command in history if it's not just whitespace
        const commandWithNoWhitespace = this.currentCommand.replace(/^\s+/, '').replace(/\s+$/, '');
        if (commandWithNoWhitespace !== '') {
            this.currCommandIndex = -1;
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
        let commandName = commandComponents[0];
        const args = commandComponents.splice(1);
        set(this, 'currentArgs', args);

        // don't do anything if the user is rude
        if (this._commandHasSwears(this.currentCommand)) {
            this._handleFilthyInput();

            return;
        }

        // find command
        if (isPresent(this.overrideScope)) {
            // if command is at app scope, find it
            if (isPresent(this.overrideScope[commandName])) {

                // handle enter bug
                if (commandName === 'enter' ||
                commandName === 'exit' ||
                commandName === 'init') {

                    this._handleInvalidInput(commandName.toUpperCase());
                    return;
                }

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

    _commandHasSwears(currentCommand) {
        for (let i = 0; i < environmentValues.badWords.length; i++) {
            const currBadWord = environmentValues.badWords[i];
            if (currentCommand.includes(currBadWord)) {
                return true;
            }
        }

        return false;
    },

    _handleCommandExecution(commandDefinition) {
        if (commandDefinition.routeName) {
            // run app route
            getOwner(this).lookup('router:main').transitionTo(commandDefinition.routeName);
            return;
        }
        
        this._handleInvalidInput(commandDefinition.commandName.toUpperCase());
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

        // handle quit
        const quitEntries = ['Q', 'QUIT', 'EXIT'];

        if (isPresent(appName)) {
            // handle SUDO
            if (['sudo', 'chmod', 'su'].includes(appName)) {
                set(this, 'appResponse', ['Nice try nerd. ACCESS DENIED.']);
            } else if (appName === 'hack') {
                set(this, 'appResponse', ['Hacking mainframe...', 'ACCESS GRANTED', '', '', '...jklol ACCESS DENIED.']);
            } else if (quitEntries.includes(appName)) {
                set(this, 'appResponse', ['exiting...']);
                this.quit();
            } else {
                set(this, 'appResponse', [`ERROR: ${appName}: command not found.`]);
            }

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
        this.statusBar.clearStatusMessage();
        getOwner(this).lookup('router:main').transitionTo('index');
    },

    // ------------------- public methods -------------------

    handleScreenInput(input) {
        set(this, 'currentCommand', input);
        this._execute();
    },

    handleEsc() {
        this.processKey({ key: 'ESCAPE', preventDefault: () => {} });
    },

    handleDirection(dir) {
        this.processKey({ key: dir, preventDefault: () => {} });
    },

    callArrow(dir) {
        this.processKey({ key: dir, preventDefault: () => { } });
    },

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
        this.setBgImage(null);

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

                if (entry === 'ESCAPE') {
                    // stop user from tabbing outside of browser focus
                    keyEvent.preventDefault();
                }

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
