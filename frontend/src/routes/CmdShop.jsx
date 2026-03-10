import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';

const SHOP_IMAGES = Object.freeze([
    { url: 'shop.jpg', itemMapId: null },
    { url: 'teeshirt1.jpg', itemMapId: 0 },
    { url: 'hoodie2.jpg', itemMapId: 1 },
    { url: 'stickers3.jpg', itemMapId: 2 },
    { url: 'hoodie1.jpg', itemMapId: 1 },
    { url: 'teeshirt2.jpg', itemMapId: 0 },
    { url: 'stickers1.jpg', itemMapId: 2 },
    { url: 'hoodie3.jpg', itemMapId: 1 },
    { url: 'teeshirt3.jpg', itemMapId: 0 },
]);

const SHOP_ITEMS = Object.freeze([
    { id: 0, name: 'Teeshirt', price: 35, desc: 'Yellow.' },
    { id: 1, name: 'Hoodie (light weight)', price: 65, desc: 'Black.' },
    { id: 2, name: 'Sticker Pack', price: 7, desc: 'Five assorted stickers.' },
]);

const MAIN_DESCRIPTION = Object.freeze([
    '',
    'Limited edition garments and items:',
    'NO LONGER AVAILABLE',
    '',
    '<- use arrows to navigate gallery ->',
    'ESC to quit',
    '? to show this message again.',
]);

function getItems() {
    return SHOP_ITEMS.map(item => ` - $${item.price}.00 | ${item.name}`);
}

export default function CmdShop() {
    const inputProcessor = useOutletContext();

    // Keep a fresh ref to inputProcessor so the keyOverride closures (created
    // once in useEffect) can always call the latest setBgImage.
    const inputProcessorRef = useRef(null);
    inputProcessorRef.current = inputProcessor;

    // Mutable index that doesn't need to trigger re-renders.
    const currentShopIndexRef = useRef(0);

    useEffect(() => {
        function getImagePath() {
            return `shop/${SHOP_IMAGES[currentShopIndexRef.current].url}`;
        }

        function displayImage() {
            inputProcessorRef.current.setBgImage(getImagePath());
        }

        const scope = {
            help() {
                inputProcessorRef.current.handleFunctionFromApp([...MAIN_DESCRIPTION]);
            },
            inventory() { scope.items(); },
            items() {
                inputProcessorRef.current.handleFunctionFromApp(getItems());
            },
        };

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-shop',
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            response: [...MAIN_DESCRIPTION],
            keyOverrides: {
                ARROWLEFT: () => {
                    let newIndex = currentShopIndexRef.current - 1;
                    if (newIndex < 0) { newIndex = SHOP_IMAGES.length - 1; }
                    currentShopIndexRef.current = newIndex;
                    displayImage();
                },
                ARROWRIGHT: () => {
                    let newIndex = currentShopIndexRef.current + 1;
                    if (newIndex > SHOP_IMAGES.length - 1) { newIndex = 0; }
                    currentShopIndexRef.current = newIndex;
                    displayImage();
                },
            },
            overrideScope: scope
        });

        inputProcessor.setAppEnvironment(appEnvironment);
        displayImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
