import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import commandRegistry from '../const/command-registry';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        this.inputProcessor.setAppEnvironment({
            activeAppName: this.routeName,
            displayAppNameInPrompt: false,
            interruptPrompt: false,
            response: commandRegistry.registry.map((currCmdDef) => {
                return currCmdDef.commandName;
            })
        });
    }
});