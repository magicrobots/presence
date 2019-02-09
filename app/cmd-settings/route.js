import Route from '@ember/routing/route';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    testFunc() {
        this.inputProcessor.handleFunctionFromApp(['it\'s alive']);
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