import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        this.inputProcessor.setAppEnvironment({
            activeAppName: this.routeName,
            displayAppNameInPrompt: false,
            interruptPrompt: false,
            response: ['I\'m a computer.',
                'Enter the LS command to view a list of available commands.',
                'Commands are not case sensitive.',
                'For help on a specific command, type \'help {commandName}\'',
                'To quit any running application type Q to return to command line interface.']
        });
    }
});