import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { set, computed, observer } from '@ember/object';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    currentShopIndex: 0,
    shopImages: Object.freeze([
        'shop0.jpg',
        'shop1.jpg']),

    _arrowLeft(scope) {
        let newIndex = scope.currentShopIndex - 1;
        if (newIndex < 0) {
            newIndex = scope.shopImages.length - 1;
        }

        set(scope, 'currentShopIndex', newIndex);
    },

    _arrowRight(scope) {
        let newIndex = scope.currentShopIndex + 1;
        if (newIndex > scope.shopImages.length - 1) {
            newIndex = 0;
        }

        set(scope, 'currentShopIndex', newIndex);
    },

    imagePath: computed('currentShopIndex', {
        get() {
            return `shop/${this.shopImages[this.currentShopIndex]}`;
        }
    }),

    imageIndexChanged: observer('currentShopIndex', function() {
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
            response: ['<- use arrows to navigate gallery ->', 'ESC to quit'],
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