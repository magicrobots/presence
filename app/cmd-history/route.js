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
                'Public perception of lack of need however, effected the v5DoR to lose public funding. MAGIC ROBOTS was formed as a private entity to help fund the v5DoR\'s efforts. We help keep Magic Robots in the collective consciousness of the public and maintain awareness of their powerful and important history, as well as to educate about their true nature in the case that you are fortunate enough to encounter a now rare sighting.']
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});
