import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        this.inputProcessor.setAppEnvironment({
            activeAppName: this.routeName,
            displayAppNameInPrompt: false,
            interruptPrompt: false,
            response: ['This is a computer simulation.',
                'It was written in javascript utilizing:',
                '  ember',
                '  canvas',
                '  github',
                '  stack overflow',
                '  appveyor continuous integration into AWS',
                '  surely some other nerdy things',
                'gimme a shout with questions (run contact command)']
        });
    }
});