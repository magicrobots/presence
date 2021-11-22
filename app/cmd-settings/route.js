import Route from '@ember/routing/route';
import { isBlank } from '@ember/utils';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),

    escText: Object.freeze(['', 'ESC to quit']),
    settingsCommandRegistry: Object.freeze([
        'username',
        'fontsize',
        'graphicsmode'
    ]),

    _commonProcesses(overflowArg, hideEscText, functionName, appResponse, persistenceSet, validSet) {
        const inputArg = this.inputProcessor.currentArgs[0];
        const newValue = overflowArg || inputArg;
        const escTextLines = hideEscText ? [] : this.escText;
        const jumpIn = this.inputProcessor.currentCommand === `settings ${functionName}`;

        if (jumpIn || isBlank(newValue) ||
            validSet.length && !validSet.includes(newValue)) {
            this.inputProcessor.handleFunctionFromApp(appResponse.concat(escTextLines));

            return;
        }

        this.persistenceHandler[persistenceSet](newValue);
        this.inputProcessor.handleFunctionFromApp([`${functionName} changed to ${newValue}.`].concat(escTextLines));
    },

    username(overflowArg, hideEscText ) {
        const appResponse = [`Current username: ${this.persistenceHandler.getUsername()}`,
            '',
            `enter second parameter to set username - e.g.: 'username HAL9000'`]

        this._commonProcesses(
            overflowArg,
            hideEscText,
            'username',
            appResponse,
            'setUsername',
            []
        );
    },

    fontsize(overflowArg, hideEscText) {
        const appResponse = [`Current fontsize: ${this.persistenceHandler.getFontSize()}`,
            '',
            `enter s, m, or l as second parameter to set fontsize - e.g.: 'fontsize s'`]

        this._commonProcesses(
            overflowArg,
            hideEscText,
            'fontsize',
            appResponse,
            'setFontSize',
            ['s', 'm', 'l']
        );
    },

    graphicsmode(overflowArg, hideEscText) {
        const appResponse = [`Graphics mode is currently: ${this.persistenceHandler.getGraphicsMode()}`,
            '',
            `enter 'hi' or 'lo' as second parameter to toggle graphics - e.g.: 'graphicsmode hi'`,
            'beware, hi graphicsmode can be processor intensive.']

        this._commonProcesses(
            overflowArg,
            hideEscText,
            'graphicsmode',
            appResponse,
            'setGraphicsMode',
            ['hi', 'lo']
        );
    },

    afterModel() {        
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: this,
            response: ['Available settings:',
                '  username',
                '  fontsize',
                '  graphicsmode'].concat(this.escText)
        });

        // handle overflow arguments
        if (this.inputProcessor.currentArgs.length > 0) {
            const overflowCommand = this.inputProcessor.currentArgs[0];
            if (this.settingsCommandRegistry.includes(overflowCommand)) {
                const overflowArg = this.inputProcessor.currentArgs[1];
                this[overflowCommand](overflowArg, true);
                this.inputProcessor.quit();

                return;
            }
        }

        this.inputProcessor.setAppEnvironment(appEnvironment);
    },

    commandComplete(fragment, scope) {
        return environmentHelpers.handleTabComplete(fragment, [scope.settingsCommandRegistry]);
    }
});
