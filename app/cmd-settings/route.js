import Route from '@ember/routing/route';
import { isBlank } from '@ember/utils';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),

    username() {
        const newName = this.inputProcessor.currentArgs[0];

        if (isBlank(newName)) {
            this.inputProcessor.handleFunctionFromApp([`enter second parameter to set username - e.g.: 'username HAL9000'`]);

            return;
        }

        this.persistenceHandler.setUsername(newName);
        this.inputProcessor.handleFunctionFromApp([`username changed to ${newName}.`]);
    },

    promptcolor() {
        const newColor = this.inputProcessor.currentArgs[0];

        if (isBlank(newColor)) {
            this.inputProcessor.handleFunctionFromApp([`enter valid hex code as second parameter to change prompt color - e.g.: 'promptcolor #336699'`]);

            return;
        }

        // test for color validity
        const isValidHex  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(newColor);
        if (isValidHex) {
            this.persistenceHandler.setPromptColor(newColor);
            this.inputProcessor.handleFunctionFromApp([`Prompt color changed to ${newColor}`]);
        } else {
            this.inputProcessor.handleFunctionFromApp([`second parameter must be valid hex color - e.g.: 'promptcolor #336699'`]);
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
                '  promptcolor']
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});