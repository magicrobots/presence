import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';

export default function CmdHistory() {
    const inputProcessor = useOutletContext();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-history',
            response: [
                'MAGIC ROBOTS is the private arm of the V.5. Department of Robotics (v5DoR).',
                '',
                '10-15 years ago Robot sightings became less and less frequent. Many assumed they had disappeared.',
                '',
                'This was not true, of course. Our close monitoring and continued communication with the Robots never faltered, regardless of a media spotlight. Our hard work continued.',
                '',
                'Public perception of lack of need however, effected the v5DoR to lose public funding. MAGIC ROBOTS was formed as a private entity to help fund the v5DoR\'s efforts. We help keep Magic Robots in the collective consciousness of the public and maintain awareness of their powerful and important history, as well as to educate about their true nature in the case that you are fortunate enough to encounter a now rare sighting.'
            ]
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
