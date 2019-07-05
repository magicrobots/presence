import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    _getCdResponse() {
        const rawInputArgs = this.inputProcessor.rawUserEntry.split(' ')[1];
        let cdTarget = rawInputArgs;

        // cd into current directory is noop
        if (cdTarget === '.' || cdTarget === './') {
            return;
        }

        // remove trailing slash if it's on there
        if (cdTarget.charAt(cdTarget.length - 1) === '/') {
            cdTarget = cdTarget.substr(0, cdTarget.length -1);
        }

        const responseDenied = `cd: ${cdTarget}/ ACCESS DENIED`;

        // deny access if they're trying to CD to root or home
        if (cdTarget.charAt(0) === '/' || cdTarget.charAt(0) === '~' ||
            rawInputArgs === '/') {
            return responseDenied;
        }

        const allCommands = commandRegistry.registry;
        const matchedCmdDef = allCommands.findBy('commandName', cdTarget);

        if (matchedCmdDef) {
            if (matchedCmdDef.isDir) {
                return responseDenied;
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