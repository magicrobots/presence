import { useRef } from 'react';

import environmentHelpers from '../utils/environment-helpers';
import { createGalleryEnvironment } from './shared/galleryNavigator';
import { useRouteInit } from './shared/useRouteInit';
import type { ShopImage, GalleryConfig } from './shared/galleryNavigator';
import type { InputProcessor } from '../types/terminal';

interface ShopItem {
    id: number;
    name: string;
    price: number;
    desc: string;
}

const SHOP_IMAGES: readonly ShopImage[] = Object.freeze([
    { path: 'shop.jpg', itemMapId: -1 },
    { path: 'teeshirt1.jpg', itemMapId: 0 },
    { path: 'hoodie2.jpg', itemMapId: 1 },
    { path: 'stickers3.jpg', itemMapId: 2 },
    { path: 'hoodie1.jpg', itemMapId: 1 },
    { path: 'teeshirt2.jpg', itemMapId: 0 },
    { path: 'stickers1.jpg', itemMapId: 2 },
    { path: 'hoodie3.jpg', itemMapId: 1 },
    { path: 'teeshirt3.jpg', itemMapId: 0 },
]);

const SHOP_ITEMS: readonly ShopItem[] = Object.freeze([
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

function getItems(): string[] {
    return SHOP_ITEMS.map(item => ` - $${item.price}.00 | ${item.name}`);
}

export default function CmdShop() {
    // Keep a fresh ref to inputProcessor so the keyOverride closures (created
    // once in useEffect) can always call the latest setBgImage.
    const inputProcessorRef = useRef<InputProcessor | null>(null);

    const inputProcessor = useRouteInit((ip) => {
        inputProcessorRef.current = ip;

        const config: GalleryConfig<ShopImage> = {
            images: SHOP_IMAGES,
            getImagePath: (item) => {
                const path = `shop/${item.path}`;
                inputProcessorRef.current!.setBgImage(path);
                return path;
            },
            initialResponse: [...MAIN_DESCRIPTION],
            additionalCommands: {
                help: () => {
                    inputProcessorRef.current!.handleFunctionFromApp([...MAIN_DESCRIPTION]);
                    return [...MAIN_DESCRIPTION];
                },
                inventory: () => {
                    const items = getItems();
                    inputProcessorRef.current!.handleFunctionFromApp(items);
                    return items;
                },
                items: () => {
                    const items = getItems();
                    inputProcessorRef.current!.handleFunctionFromApp(items);
                    return items;
                },
            },
        };

        const galleryEnv = createGalleryEnvironment(config);

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            ...galleryEnv,
            activeAppName: 'cmd-shop',
            displayAppNameInPrompt: true,
            interruptPrompt: true,
        });

        ip.setAppEnvironment(appEnvironment);
        // Display initial image
        inputProcessorRef.current!.setBgImage(`shop/${SHOP_IMAGES[0].path}`);
    });

    // Keep ref current on every render so gallery closures always have latest instance.
    inputProcessorRef.current = inputProcessor;

    return null;
}
