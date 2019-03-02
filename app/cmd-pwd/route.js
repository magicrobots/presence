import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { dasherize } from '@ember/string';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: [`/magicrobots/users/${dasherize(this.persistenceHandler.getUsername())}/`]
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});