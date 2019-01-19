import Service from '@ember/service';
import { set, computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';

import commandRegistry from '../const/command-registry';

export default Service.extend({

    CURSOR_CHAR: '█',

    currentCommand: '',
    currentArgs: undefined,
    activeApp: undefined,
    isPromptCursorVisible: true,
    relevantMarkup: undefined,
    cursorLoopContainer: undefined,
    cursorPosition: 0,
    currCommandIndex: -1,

    init() {
        this._super(...arguments);

        // set defaults
        set(this, 'commandHistory', []),
        set(this, 'appResponse', []),
        set(this, 'previousExecutionBlocks', []),

        this._startPromptCursorLoop();
    },
    
    destroy() {
        clearInterval(this.cursorLoopContainer);
        this._super(...arguments);
    },

    // ------------------- computed properties -------------------
    
    PROMPT_LINE_1: computed({
        get() {
            // just some random nerdy stuff
            const ref = document.referrer.substr(document.referrer.indexOf('/'));
            const code = navigator.appCodeName;
            const plat = navigator.platform;
            const lang = navigator.language;

            return `source[${ref}] ${code} ${plat} ${lang} | magicrobots/ (unknown user)`;
        }
    }),

    PROMPT_LINE_2: computed('activeApp', 'displayAppNameInPrompt', {
        get() {
            // add name of app if there's an active app
            const timestamp = new Date().getTime().toString().substr(5);
            const context = isPresent(this.activeApp) ?
                ` ${this.activeApp}` :
                '';

            // only display context if it's requested
            const displayedContext = this.displayAppNameInPrompt ? context : '';

            const promptEnd = this.displayAppNameInPrompt && isPresent(this.activeApp) ? '>' : '$:';

            return `${timestamp}${displayedContext} ${promptEnd}`;
        }
    }),

    currExecutionBlock: computed('PROMPT_LINE_1',
        'PROMPT_LINE_2',
        'isPromptCursorVisible',
        'appResponse.[]',
        'currentCommand',
        'forceDisplayCursor', {

        get() {
            // duplicate command string
            let commandDisplay = this.currentCommand.slice(0);

            // display cursor in position
            if (this.isPromptCursorVisible || this.forceDisplayCursor) {
                commandDisplay = this.currentCommand.substr(0, this.cursorPosition) +
                    this.CURSOR_CHAR +
                    this.currentCommand.substr(this.cursorPosition + 1);
            }

            const interactiveLine = `${this.PROMPT_LINE_2}${commandDisplay}`;

            return this.appResponse.concat(['', this.PROMPT_LINE_1, interactiveLine]);
        }
    }),

    allDisplayLines: computed('currExecutionBlock', {
        get() {
            return isPresent(this.previousExecutionBlocks) ?
                this.previousExecutionBlocks.concat(this.currExecutionBlock) :
                this.currExecutionBlock;
        }
    }),

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
        // const ownerContext = getOwner(this);
        const isViewerActiveDiv = document.activeElement === this.relevantMarkup;
        return isViewerActiveDiv;
    },

    _resetCommandLine() {
        set(this, 'currentCommand', '');
        set(this, 'currentArgs', undefined);
        set(this, 'appResponse', []);
        set(this, 'cursorPosition', 0);
    },

    _execute() {
        // store command in history
        this.commandHistory.unshift(this.currentCommand);

        // kill cursor
        set(this, 'forceDisplayCursor', false);
        set(this, 'isPromptCursorVisible', false);

        // store execution block
        set(this, 'previousExecutionBlocks',
            this.previousExecutionBlocks.concat(Object.assign([],
                this.currExecutionBlock)).concat(['']));

        // create executable command from string
        const commandComponents = this.currentCommand.split(' ');
        const appName = commandComponents[0].toUpperCase();
        set(this, 'args', commandComponents.splice(1));

        // unset stuff
        this._resetCommandLine();

        // find command
        const commandList = commandRegistry.registry;
        const matchedCommand = commandList.filter((currCmdDef) => {
            if(currCmdDef.commandName.toUpperCase() === appName) {
                return true;
            }
        })[0];

        // execute command if it exists
        if (isPresent(matchedCommand)) {
            this._handleCommandExecution(matchedCommand, appName);
        } else {
            this._handleInvalidInput(appName);
        }
    },

    _handleCommandExecution(commandDefinition, appName) {
        if (isPresent(commandDefinition.routeName)) {
            getOwner(this).lookup('router:main').transitionTo(commandDefinition.routeName);
        } else {
            set(this, 'appResponse', [`ERROR: ${appName} route not defined.`]);
        }
    },

    _handleInvalidInput(appName) {
        if (isPresent(appName)) {
            set(this, 'appResponse', [`ERROR: ${appName} is not a recognized directive.`]);
            return;
        }

        set(this, 'appResponse', ['enter something']);
    },

    // ------------------- public methods -------------------

    setAppEnvironment(appEnvironment) {
        set(this, 'activeApp', appEnvironment.activeAppName);
        set(this, 'appResponse', appEnvironment.response);
        set(this, 'displayAppNameInPrompt', appEnvironment.displayAppNameInPrompt);
        set(this, 'interruptPrompt', appEnvironment.interruptPrompt);
    },

    clear() {
        set(this, 'previousExecutionBlocks', []);
        set(this, 'activeApp', undefined);
        this._resetCommandLine();
        getOwner(this).lookup('router:main').transitionTo('index');
    },

    processKey(keyEvent) {
        let deleteFromCommand;
        let newCommand;
        let newCursorIndex;
        let cursorIndexMax;
        let newCommandIndex;

        switch(keyEvent.key.toUpperCase()) {
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
            case 'SCROLLLOCK':
            case 'PAUSE':
            case 'CAPSLOCK':
            case 'META':
            case 'TAB':
            case 'ESCAPE':
            case 'CONTROL':
            case 'SHIFT':
            case 'ALT': 
            case 'AUDIOVOLUMEUP':
            case 'AUDIOVOLUMEDOWN':
            case 'AUDIOVOLUMEMUTE':
                // ignore the above keystrokes
                break;

            case 'ARROWUP':
                newCommandIndex = this.currCommandIndex + 1;
                if (newCommandIndex > this.commandHistory.length - 1) {
                    newCommandIndex = this.commandHistory.length - 1;
                }

                set(this, 'currCommandIndex', newCommandIndex);
                newCommand = this.commandHistory[this.currCommandIndex] || '';
                set(this, 'currentCommand', newCommand);
                set(this, 'cursorPosition', this.currentCommand.length);
                break;

            case 'ARROWDOWN':
                newCommandIndex = this.currCommandIndex - 1;
                if (newCommandIndex < -1) {
                    newCommandIndex = -1;
                }

                set(this, 'currCommandIndex', newCommandIndex);
                newCommand = this.commandHistory[this.currCommandIndex] || '';
                set(this, 'currentCommand', newCommand);
                set(this, 'cursorPosition', this.currentCommand.length);
                break;

            case 'PAGEUP':
            case 'HOME':
                set(this, 'cursorPosition', 0);
                set(this, 'forceDisplayCursor', true);
                break;

            case 'PAGEDOWN':
            case 'END':
                set(this, 'cursorPosition', this.currentCommand.length);
                set(this, 'forceDisplayCursor', true);
                break;

            case 'ARROWLEFT':
                newCursorIndex = this.cursorPosition - 1;
                if (newCursorIndex < 0) {
                    newCursorIndex = 0;
                }

                set(this, 'cursorPosition', newCursorIndex);
                set(this, 'forceDisplayCursor', true);
                break;

            case 'ARROWRIGHT':
                newCursorIndex = this.cursorPosition + 1;
                cursorIndexMax = this.currentCommand.length;
                if (newCursorIndex > cursorIndexMax) {
                    newCursorIndex = cursorIndexMax;
                }
                
                set(this, 'cursorPosition', newCursorIndex);
                set(this, 'forceDisplayCursor', true);
                break;

            case 'DELETE':
                // remove char from command
                deleteFromCommand = this.currentCommand.substr(0, this.cursorPosition) +
                    this.currentCommand.substr(this.cursorPosition + 1);

                set(this, 'currentCommand', deleteFromCommand);
                
                break;

            case 'BACKSPACE':
                // remove char from command                
                newCursorIndex = this.cursorPosition - 1;
                if (newCursorIndex < 0) {
                    newCursorIndex = 0;
                }
                
                set(this, 'cursorPosition', newCursorIndex);

                deleteFromCommand = this.currentCommand.substr(0, this.cursorPosition) +
                    this.currentCommand.substr(this.cursorPosition + 1);

                set(this, 'currentCommand', deleteFromCommand);
                break;

            case 'ENTER':
                this._execute();
                break;

            default:
                // add char to command from cursorPosition index
                newCommand = this.currentCommand.substr(0, this.cursorPosition) +
                    keyEvent.key +
                    this.currentCommand.substr(this.cursorPosition);

                set(this, 'currentCommand', newCommand);
                set(this, 'cursorPosition', this.cursorPosition + 1);
                break;
        }
    }
});
