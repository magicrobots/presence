import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { set, computed } from '@ember/object';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    currentImgIndex: 0,
    stillImages: Object.freeze([
        'pond.jpg',
        'forest.jpg',
        'crashSite.jpg',
        'robot.jpg',
        'servers.jpg',
        'cave.jpg',
        'meadow.jpg']),

    _arrowLeft(scope) {
        let newIndex = scope.currentImgIndex - 1;
        if (newIndex < 0) {
            newIndex = scope.stillImages.length - 1;
        }

        set(scope, 'currentImgIndex', newIndex);
        scope._displayImage();
    },

    _arrowRight(scope) {
        let newIndex = scope.currentImgIndex + 1;
        if (newIndex > scope.stillImages.length - 1) {
            newIndex = 0;
        }

        set(scope, 'currentImgIndex', newIndex);
        scope._displayImage();
    },

    imagePath: computed('currentImgIndex', {
        get() {
            return `stills/${this.stillImages[this.currentImgIndex]}`;
        }
    }),

    _displayImage() {
        this.inputProcessor.setBgImage(this.imagePath);
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