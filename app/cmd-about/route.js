import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults(
            this.routeName,
            false,
            false,
            ['This is a computer simulation.',
                'It was written in javascript utilizing:',
                '  ember',
                '  canvas',
                '  github',
                '  stack overflow',
                '  appveyor continuous integration into AWS',
                '  surely some other nerdy things',
                '',
                'gimme a shout with questions (run contact command)']
        );

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});