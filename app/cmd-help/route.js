import Route from '@ember/routing/route';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    _getResponse() {
        let response = ['I\'m a computer.',
            'Enter the LS command to view a list of available commands.',
            'Commands are not case sensitive.',
            'For help on a specific command, type \'help {commandName}\'',
            'To quit any running application type Q to return to command line interface.'];

        const args = this.inputProcessor.currentArgs;
        if (isPresent(args)) {
            const helpAppName = args[0];
            const matchedCommand = commandRegistry.getMatchingCommand(helpAppName);
            if (isPresent(matchedCommand)) {
                response = [`${helpAppName}: ${matchedCommand.helpText}`];

                // append usage if it's there
                if (isPresent(matchedCommand.usage)) {
                    response =response.concat([`  usage: ${matchedCommand.usage}`]);
                }
            }
        }

        return response;
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults(
            this.routeName,
            false,
            false,
            this._getResponse()
        );

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});