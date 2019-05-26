import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: ['MAGIC ROBOTS is the private arm of the V.5. Department of Robotics (v5DoR).',
                '',
                '10-15 years ago Robot sightings became less and less frequent. Many assumed they had disappeared.',
                '',
                'This was not true, of course. Our close monitoring and continued communication with the Robots never faltered, regardless of a media spotlight. Our hard work continued.',
                '',
                'Public perception of lack of need however, effected the v5DoR to lose public funding. MAGIC ROBOTS was formed as a private entity to help fund the v5DoR\'s efforts. We chose fashion and street wear to help keep Magic Robots in the collective consciousness of the public and maintain awareness of their powerful and important history, and to educate about their true nature in the case that you are fortunate enough to encounter a now rare sighting.']
            // response: ['I had a the following goals for this website:',
            // ' - Create a command-line interface',
            // ' - Use canvas to create a crappy old CRT monitor effect',
            // ' - Create a Zork style text adventure game',
            // '',
            // 'I architected the faux-unix interface as well as the adventure command logic without doing any research, so I\'m sure there is plenty I could do to make it more efficient.  Full disclosure: I did google a Zork command list for ideas.',
            // '',
            // 'Site was written in javascript utilizing:',
            // '  ember',
            // '  canvas',
            // '  stack overflow',
            // '  math',
            // '  continuous integration using:',
            // '    github ->',
            // '    appveyor ->',
            // '    deployment to AWS S3',
            // '  surely some other nerdy things',
            // '',
            // 'gimme a shout with feedback, suggestions or questions (run contact command)']
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});