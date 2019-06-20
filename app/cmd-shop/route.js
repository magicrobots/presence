import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { set, computed, observer } from '@ember/object';
import { isPresent } from '@ember/utils';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),
    statusBar: service(),
    currentShopIndex: 0,

    shopImages: Object.freeze([
        {
            url: 'shop.jpg',
            itemMapId: null
        },
        {
            url: 'teeshirt1.jpg',
            itemMapId: 0
        },
        {
            url: 'stickers1.jpg',
            itemMapId: 2
        },
        {
            url: 'teeshirt2.jpg',
            itemMapId: 0
        },
        {
            url: 'stickers2.jpg',
            itemMapId: 2
        }
    ]),

    shopItems: Object.freeze([
        { 
            id: 0,
            name: 'Teeshirt',
            price: 25,
            desc: 'yellow. sizes S-XXL'
        },
        { 
            id: 1,
            name: 'Hoodie',
            price: 75,
            desc: 'black. sizes S-XXL'
        },
        { 
            id: 2,
            name: 'Sticker Pack',
            price: 7,
            desc: '4 assorted stickers'
        }
    ]),

    MAIN_DESCRIPTION: Object.freeze(['',
        'Submit payment via paypal to Automated Direct Accounting Matrix (ADAM): ADAM@MAGICROBOTS.COM',
        '',
        'Any submission that deviates from the following ruleset will be rejected and refunded:',
        ' - Note field must include garment sizes if applicable',
        ' - Note field must include shipping address',
        ' - Payment type must be "Friends and Family"',
        ' - $15 flat fee ($3 if just stickers) for shipping must be included in calculation.',
        ' - Payment calculation must be correct.',
        '',
        '<- use arrows to navigate gallery ->', 'ESC to quit', '? to show this message again.']),

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

    help() {
        this.inputProcessor.handleFunctionFromApp(this.MAIN_DESCRIPTION);
    },

    inventory() { this.items() },
    items() {
        this.inputProcessor.handleFunctionFromApp(this._getItems());
    },

    imagePath: computed('currentShopIndex', {
        get() {
            return `shop/${this.shopImages[this.currentShopIndex].url}`;
        }
    }),

    imageIndexChanged: observer('currentShopIndex', function() {
        this._displayImage();
    }),

    _displayImage() {
        const currImageItem = this.shopItems[this.shopImages[this.currentShopIndex].itemMapId];
        const itemMessage = isPresent(currImageItem) ?
            `${currImageItem.name} | $${currImageItem.price} | ${currImageItem.desc}` :
            null;
        this.statusBar.setStatusMessage(itemMessage);
        set(this.inputProcessor, 'bgImage', this.imagePath);
    },

    _getItems() {
        return this.shopItems.map((currItem) => {
            return ` - $${currItem.price}.00 | ${currItem.name}`;
        });
    },

    afterModel() {

        const response = ['Available items:', '']
            .concat(this._getItems())
            .concat(this.MAIN_DESCRIPTION);

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            response: response,
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