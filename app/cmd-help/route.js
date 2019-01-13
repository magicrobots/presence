import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        this.inputProcessor.setAppEnvironment({
            activeAppName: this.routeName,
            displayAppNameInPrompt: false,
            interruptPrompt: false,
            response: ['This is a command line interface.',
                'Use LS command to view list of available commands.',
                'Commands are not case sensitive.',
                'For help on specific command, type \'help {commandName}\'',
                'To quit any running application type Q to return to command line interface.']
        });
    }
});