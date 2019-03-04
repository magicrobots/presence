import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { set, computed, observer } from '@ember/object';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    currentBotIndex: 0,
    robotImages: Object.freeze([
        'beach.jpg',
        'atst.jpg',
        'classic.jpg',
        'hover.jpg',
        'tripod.jpg',
        'bunny.jpg',
        'wired.jpg']),

    _arrowLeft(scope) {
        let newIndex = scope.currentBotIndex - 1;
        if (newIndex < 0) {
            newIndex = scope.robotImages.length - 1;
        }

        set(scope, 'currentBotIndex', newIndex);
    },

    _arrowRight(scope) {
        let newIndex = scope.currentBotIndex + 1;
        if (newIndex > scope.robotImages.length - 1) {
            newIndex = 0;
        }

        set(scope, 'currentBotIndex', newIndex);
    },

    imagePath: computed('currentBotIndex', {
        get() {
            return `robots/${this.robotImages[this.currentBotIndex]}`;
        }
    }),

    imageIndexChanged: observer('currentBotIndex', function() {
        this._displayImage();
    }),

    _displayImage() {
        set(this.inputProcessor, 'bgImage', this.imagePath);
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            response: ['<- use arrows to navigate imagery ->', 'ESC to quit'],
            keyOverrides: {
                ARROWLEFT: this._arrowLeft,
                ARROWRIGHT: this._arrowRight,
            },
            overrideScope: this
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
        this._displayImage();
    }
});