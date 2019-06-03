import Route from '@ember/routing/route';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    _getCdResponse() {
        let cdTarget = this.inputProcessor.currentArgs[0];

        // remove trailing slash if it's on there
        if (cdTarget.charAt(cdTarget.length - 1) === '/') {
            cdTarget = cdTarget.substr(0, cdTarget.length -1);
        }

        const allCommands = commandRegistry.registry;
        const matchedCmdDef = allCommands.findBy('commandName', cdTarget);

        if (isPresent(matchedCmdDef)) {
            if (matchedCmdDef.isExec) {
                return `cd: ${cdTarget} ACCESS DENIED`;
            }
            return `cd: ${cdTarget}: Not a directory`;
        } else {
            return `cd: ${cdTarget} No such file or directory`;
        }
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: [this._getCdResponse()]
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});