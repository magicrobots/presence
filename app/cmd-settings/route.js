import Route from '@ember/routing/route';
import { isBlank, isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';
import MagicNumbers from '../const/magic-numbers';

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),

    escText: Object.freeze(['', 'ESC to quit']),
    settingsCommandRegistry: Object.freeze([
        'promptcolor',
        'username'
    ]),

    username(overflowArg, hideEscText) {
        const newName = overflowArg || this.inputProcessor.currentArgs[0];
        const escTextLines = hideEscText ? [] : this.escText;

        if (isBlank(newName)) {
            this.inputProcessor.handleFunctionFromApp([`Current username: ${this.persistenceHandler.getUsername()}`,
                '',
                `enter second parameter to set username - e.g.: 'username HAL9000'`].concat(escTextLines));

            return;
        }

        this.persistenceHandler.setUsername(newName);
        this.inputProcessor.handleFunctionFromApp([`username changed to ${newName}.`].concat(escTextLines));
    },

    promptcolor(overflowArg, hideEscText) {
        const newColor = overflowArg || this.inputProcessor.currentArgs[0];
        const escTextLines = hideEscText ? [] : this.escText;

        if (isBlank(newColor)) {
            this.inputProcessor.handleFunctionFromApp([`Current prompt color: ${this.persistenceHandler.getPromptColor() || MagicNumbers.DEFAULT_PROMPT_COLOR}`,
                '',
                `enter valid hex code as second parameter to change prompt color - e.g.: 'promptcolor #336699'`].concat(escTextLines));

            return;
        }

        // test for color validity
        const isValidHex  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(newColor);
        if (isValidHex) {
            this.persistenceHandler.setPromptColor(newColor);
            this.inputProcessor.handleFunctionFromApp([`Prompt color changed to ${newColor}`].concat(escTextLines));
        } else {
            this.inputProcessor.handleFunctionFromApp([`second parameter must be valid hex color - e.g.: 'promptcolor #336699'`].concat(escTextLines));
        }
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: this,
            response: ['Available settings:',
                '  username',
                '  promptcolor'].concat(this.escText)
        });

        // handle overflow arguments
        if (this.inputProcessor.currentArgs.length > 0) {
            const overflowCommand = this.inputProcessor.currentArgs[0];

            if (this.settingsCommandRegistry.includes(overflowCommand)) {
                const overflowArg = this.inputProcessor.currentArgs[1];

                if (isPresent(overflowArg)) {
                    this[overflowCommand](overflowArg, true);
                    this.inputProcessor.quit();
                    return;
                }
            }
        }

        this.inputProcessor.setAppEnvironment(appEnvironment);
    },

    commandComplete(fragment, scope) {
        return environmentHelpers.handleTabComplete(fragment, [scope.settingsCommandRegistry]);
    }
});