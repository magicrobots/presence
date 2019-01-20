import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults(
            this.routeName,
            false,
            false,
            commandRegistry.registry.map((currCmdDef) => {
                return currCmdDef.commandName;
            })
        );

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});