import Route from '@ember/routing/route';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    _getResponse() {
        let response = '';

        const args = this.inputProcessor.currentArgs;
        if (isPresent(args)) {
            const helpAppName = args[0];
            const matchedCommand = commandRegistry.getMatchingCommand(helpAppName);
            if (isPresent(matchedCommand)) {
                response = [`${helpAppName}: ${matchedCommand.helpText}`];

                // append usage if it's there
                if (isPresent(matchedCommand.usage)) {
                    response = response.concat([` usage: ${matchedCommand.usage}`]);
                }
            } else {
                response = [`  ERROR: no help file found for ${helpAppName.toUpperCase()}`];
            }
        } else {
            response = ['MAN (Manual):',
                '  Enter the LS command to view a list of available commands.',
                '  Commands are not case sensitive.',
                '  For manual on a specific command, enter \'man {command}\'',
                '  To quit any running application enter ESC to return to command line interface.'];
        }

        return response;
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: this._getResponse()
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});