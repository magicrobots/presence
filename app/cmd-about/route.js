import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: ['This is a computer simulation.',
            'It was written in javascript utilizing:',
            '  ember',
            '  canvas',
            '  stack overflow',
            '  math',
            '  continuous integration using:',
            '    github ->',
            '    appveyor ->',
            '    deployment to AWS S3',
            '  surely some other nerdy things',
            '',
            'gimme a shout with questions (run contact command)']
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});