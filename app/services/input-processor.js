import { set } from '@ember/object';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';

import commandRegistry from '../const/command-registry';
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
        // const ownerContext = getOwner(this);
        const isViewerActiveDiv = document.activeElement === this.relevantMarkup;
        return isViewerActiveDiv;
    },

    _execute() {
        // store command in history if it's not just whitespace
        const commandWithNoWhitespace = this.currentCommand.replace(/^\s+/, '').replace(/\s+$/, '');
        if (commandWithNoWhitespace !== '') {
            this.commandHistory.unshift(this.currentCommand);
        }

        // kill cursor
        set(this, 'forceDisplayCursor', false);
        set(this, 'isPromptCursorVisible', false);

        // store execution block with empty string array for empty line
        const currBlockCopy = Object.assign([],this.currExecutionBlock);
        const allBlocks = this.previousExecutionBlocks.concat(currBlockCopy).concat(['']);
        set(this, 'previousExecutionBlocks', allBlocks);

        // create executable command from string
        const commandComponents = this.currentCommand.split(' ');
        const commandName = commandComponents[0];
        const args = commandComponents.splice(1);
        set(this, 'currentArgs', args);

        // find command
        if (isPresent(this.overrideScope)) {
            // if command is at app scope, find it
            if (isPresent(this.overrideScope[commandName])) {
                this.overrideScope[commandName]();
            } else {
                this._handleInvalidInput(commandName);
            }
        } else {
            const matchedCommand = commandRegistry.getMatchingCommand(commandName.toUpperCase());

            // execute command if it exists
            if (isPresent(matchedCommand)) {
                this._handleCommandExecution(matchedCommand);
            } else {
                this._handleInvalidInput(commandName);
            }
        }
    },

    _handleCommandExecution(commandDefinition) {
        // run app route
        getOwner(this).lookup('router:main').transitionTo(commandDefinition.routeName);
    },

    _handleInvalidInput(appName) {
        set(this, 'currentCommand', '');
        set(this, 'currentArgs', undefined);

        if (isPresent(appName)) {
            set(this, 'appResponse', [`ERROR: ${appName} is not a recognized directive.`]);
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

    _reset() {
        set(this, 'currentCommand', '');
        set(this, 'currentArgs', undefined);
        set(this, 'cursorPosition', 0);
        getOwner(this).lookup('router:main').transitionTo('index');
    },

    _quit() {
        this.clear();
    },

    // ------------------- public methods -------------------

    setAppEnvironment(appEnvironment) {
        set(this, 'activeApp', appEnvironment.activeAppName);
        set(this, 'appResponse', appEnvironment.response);
        set(this, 'displayAppNameInPrompt', appEnvironment.displayAppNameInPrompt);
        set(this, 'interruptPrompt', appEnvironment.interruptPrompt);
        set(this, 'keyOverrides', appEnvironment.keyOverrides);
        set(this, 'overrideScope', appEnvironment.overrideScope);
        this._reset();
    },

    clear() {
        set(this, 'previousExecutionBlocks', []);
        set(this, 'activeApp', undefined);
        set(this, 'appResponse', []);
        set(this, 'displayAppNameInPrompt', undefined);
        set(this, 'interruptPrompt', undefined);
        set(this, 'keyOverrides', undefined);
        set(this, 'bgImage', undefined);
        set(this, 'overrideScope', undefined);
        this._reset();
    },

    handleFunctionFromApp(response) {
        set(this, 'currentCommand', '');
        set(this, 'currentArgs', undefined);
        set(this, 'appResponse', response);
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
            case 'SCROLLLOCK':
            case 'PAUSE':
            case 'CAPSLOCK':
            case 'META':
            case 'TAB':
            case 'CONTROL':
            case 'SHIFT':
            case 'ALT': 
            case 'AUDIOVOLUMEUP':
            case 'AUDIOVOLUMEDOWN':
            case 'AUDIOVOLUMEMUTE':
                // ignore the above keystrokes
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
                    if (entry === 'Q' ||
                        entry === 'ESCAPE' ||
                        entry === 'C' && keyEvent.ctrlKey === true) {
                        this._quit();

                        return;
                    }
                } else {
                    // ignore input
                    if (entry === 'ESCAPE') {
                        return;
                    }
                }

                this.addKeyToCommand(keyEvent);
                break;
        }
    }
});
