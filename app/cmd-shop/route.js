import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { set, computed } from '@ember/object';
// import { isPresent } from '@ember/utils';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),
    // statusBar: service(),
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
            url: 'hoodie2.jpg',
            itemMapId: 1
        },
        {
            url: 'stickers3.jpg',
            itemMapId: 2
        },
        {
            url: 'hoodie1.jpg',
            itemMapId: 1
        },
        {
            url: 'teeshirt2.jpg',
            itemMapId: 0
        },
        {
            url: 'stickers1.jpg',
            itemMapId: 2
        },
        {
            url: 'hoodie3.jpg',
            itemMapId: 1
        },
        {
            url: 'teeshirt3.jpg',
            itemMapId: 0
        }
    ]),

    shopItems: Object.freeze([
        { 
            id: 0,
            name: 'Teeshirt',
            price: 35,
            desc: 'Yellow.'
        },
        { 
            id: 1,
            name: 'Hoodie (light weight)',
            price: 65,
            desc: 'Black.'
        },
        { 
            id: 2,
            name: 'Sticker Pack',
            price: 7,
            desc: 'Five assorted stickers.'
        }
    ]),

    MAIN_DESCRIPTION: Object.freeze(['',
        'Limited edition garments and items:',
        'NO LONGER AVAILABLE',
        '',
        '<- use arrows to navigate gallery ->', 'ESC to quit', '? to show this message again.']),

    _arrowLeft(scope) {
        let newIndex = scope.currentShopIndex - 1;
        if (newIndex < 0) {
            newIndex = scope.shopImages.length - 1;
        }

        set(scope, 'currentShopIndex', newIndex);
        scope._displayImage();
    },

    _arrowRight(scope) {
        let newIndex = scope.currentShopIndex + 1;
        if (newIndex > scope.shopImages.length - 1) {
            newIndex = 0;
        }

        set(scope, 'currentShopIndex', newIndex);
        scope._displayImage();
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

    _displayImage() {
        // const currImageItem = this.shopItems[this.shopImages[this.currentShopIndex].itemMapId];
        // const itemMessage = isPresent(currImageItem) ?
        //     `${currImageItem.name} | N/A | ${currImageItem.desc}` :
        //     null;
        // this.statusBar.setStatusMessage(itemMessage);
        this.inputProcessor.setBgImage(this.imagePath);
    },

    _getItems() {
        return this.shopItems.map((currItem) => {
            return ` - $${currItem.price}.00 | ${currItem.name}`;
        });
    },

    afterModel() {

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            response: this.MAIN_DESCRIPTION,
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
