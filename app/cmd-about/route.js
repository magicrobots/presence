import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: ['I had a the following goals for this website:',
            ' - Create a command-line interface',
            ' - Use canvas to create a crappy old CRT monitor effect',
            ' - Create a Zork style text adventure game',
            '',
            'I architected the faux-unix interface as well as the adventure command logic without doing any research, so I\'m sure there is plenty I could do to make it more efficient.  Full disclosure: I did google a Zork command list for ideas.',
            '',
            'Site was written in javascript utilizing:',
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
            'gimme a shout with feedback, suggestions or questions (run contact command)']
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});