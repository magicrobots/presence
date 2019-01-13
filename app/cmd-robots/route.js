import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        this.inputProcessor.setAppEnvironment({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            response: ['Look!  Robots!']
        });
    }
});