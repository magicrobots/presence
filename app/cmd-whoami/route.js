import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: ['anonymous']
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});