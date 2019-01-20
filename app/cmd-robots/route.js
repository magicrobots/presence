import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults(
            this.routeName,
            true,
            true,
            ['Look!  Robots!']
        );

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});