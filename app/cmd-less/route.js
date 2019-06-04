import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isPresent, isNone } from '@ember/utils';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    _showItemContent() {
        let itemArg = isPresent(this.inputProcessor.currentArgs) ?
            this.inputProcessor.currentArgs[0] :
            null;

        if (isNone(itemArg)) {
            return ['Missing filename'];
        }

        const matchedItem = commandRegistry.registry.findBy('commandName', itemArg);

        if (isNone(matchedItem)) {
            return [`${itemArg}: No such file or directory`];
        }

        if (matchedItem.isDir) {
            return [`${itemArg} is a directory`];
        }

        if (matchedItem.isExec) {
            return [`${itemArg} is an executable`];
        }

        return isPresent(matchedItem) ? matchedItem.content : [`${itemArg}: No such file or directory`];
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: this._showItemContent()
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});