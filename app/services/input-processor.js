import Service from '@ember/service';
import { set, computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import { copy } from '@ember/object/internals';

export default Service.extend({

    CURSOR_CHAR: '_',

    currentCommand: '',
    currentArgs: undefined,
    commandHistory: [],
    registeredApps: [ 'about', 'contact' ],
    appResponse: [],
    activeApp: undefined,
    isPromptCursorVisible: true,
    relevantMarkup: undefined,
    previousExecutionBlocks: [],

    init() {
        this._super(...arguments);

        this._startPromptCursorLoop();
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

    PROMPT_LINE_2: computed('activeApp', {
        get() {
            // add name of app if there's an active app
            const timestamp = new Date().getTime().toString().substr(5);
            const context = isPresent(this.activeApp) ?
                ` ${this.activeApp}` :
                '';

            // only display context if it's requested
            const displayedContext = this.displayAppNameInPrompt ? context : '';

            return `${timestamp}${displayedContext} $`;
        }
    }),

    currExecutionBlock: computed('PROMPT_LINE_1',
        'PROMPT_LINE_2',
        'isPromptCursorVisible',
        'appResponse.[]',
        'currentCommand', {

        get() {
            const cursor = this.isPromptCursorVisible ? this.CURSOR_CHAR : '';
            const interactiveLine = `${this.PROMPT_LINE_2}:${this.currentCommand}${cursor}`;

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
        setInterval(function() {
            // check for focus
            if (scope._getIsKeyboardActive()) {
                set(scope, 'isPromptCursorVisible', !scope.isPromptCursorVisible);
            } else {
                set(scope, 'isPromptCursorVisible', false);
            }
        }, 500);
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
    },

    _execute() {
        // store command in history
        this.commandHistory.push(this.currentCommand);

        // store execution block
        set(this, 'previousExecutionBlocks',
            this.previousExecutionBlocks.concat(Object.assign([],
                this.currExecutionBlock)).concat(['']));

        // create executable command from string
        const commandComponents = this.currentCommand.split(' ');
        const appName = commandComponents[0];
        const args = commandComponents.splice(1);

        // unset stuff
        this._resetCommandLine();

        // global actions
        if (isPresent(this.activeApp)) {
            if (appName.toUpperCase() === 'Q') {
                Ember.getOwner(this).lookup('router:main').transitionTo('index');
                set(this, 'activeApp', undefined);
                return;
            }
        }

        // does command exist?
        if(this.registeredApps.includes(appName)) {
            set(this, 'currentArgs', args);
            set(this, 'activeApp', appName);
            Ember.getOwner(this).lookup('router:main').transitionTo(appName);
        } else {
            this._handleInvalidInput(appName);
        }
    },

    _handleInvalidInput(appName) {
        set(this, 'appResponse', ['theres no such thing as ' + appName]);
    },

    // ------------------- public methods -------------------

    setAppEnvironment(appEnvironment) {
        set(this, 'activeApp', appEnvironment.activeAppName);
        set(this, 'appResponse', appEnvironment.response);
        set(this, 'displayAppNameInPrompt', appEnvironment.displayAppNameInPrompt);
        set(this, 'interruptPrompt', appEnvironment.interruptPrompt);
    },

    processKey(keyEvent) {
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
            case 'PAGEUP':
            case 'PAGEDOWN':
            case 'HOME':
            case 'END':
            case 'CAPSLOCK':
            case 'META':
            case 'TAB':
            case 'ESCAPE':
            case 'ARROWLEFT':
            case 'ARROWUP':
            case 'ARROWRIGHT':
            case 'ARROWDOWN':
            case 'DELETE':
            case 'CONTROL':
            case 'SHIFT':
            case 'ALT': 
            case 'AUDIOVOLUMEUP':
            case 'AUDIOVOLUMEDOWN':
            case 'AUDIOVOLUMEMUTE':
                // ignore the above keystrokes
                break;
            case 'BACKSPACE':
                const deleteFromCommand = this.currentCommand.slice(0, -1);
                set(this, 'currentCommand', deleteFromCommand);
                break;
            case 'ENTER':
                this._execute();
                break;
            default:
                // add to command
                const appendedCommand = this.currentCommand.concat(keyEvent.key);
                set(this, 'currentCommand', appendedCommand);
                break;
        }
    }
});
