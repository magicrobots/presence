import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        this._sendAppResponse(['Here are my things:',
            '  email: adam@magicrobots.com',
            '  instagram: magicrobots',
            '  twitter: magic_robots',
            '  github: magicrobots',
            '',
            'if you run the contact command and pass the connection type it will send you there.',
            'eg: type `contact instagram`']);

        // handle transition
        if (isPresent(this.inputProcessor.currentArgs)) {
            const locationKey = this.inputProcessor.currentArgs[0];

            switch(locationKey) {
                case 'email':
                    this._redirectBrowser('mailto:adam@magicrobots.com');
                    break;
                case 'instagram':
                    this._redirectBrowser('https://www.instagram.com/magicrobots/');
                    break;
                case 'twitter':
                    this._redirectBrowser('https://twitter.com/magic_robots/');
                    break;
                case 'github':
                    this._redirectBrowser('https://github.com/magicrobots');
                    break;
                default:
                    this._sendAppResponse([`Sorry, the contact function doesn\t have a directive for ${locationKey}`]);
                    break;
            }
        }
    },

    _sendAppResponse(responseArray) {
        this.inputProcessor.setAppEnvironment({
            activeAppName: this.routeName,
            displayAppNameInPrompt: false,
            interruptPrompt: false,
            response: responseArray
        });
    },

    _redirectBrowser(url) {
        window.open(url);
    }
});