import { useRef } from 'react';

import environmentHelpers from '../utils/environment-helpers';
import { createGalleryEnvironment } from './shared/galleryNavigator';
import { useRouteInit } from './shared/useRouteInit';
import type { GalleryImage, GalleryConfig } from './shared/galleryNavigator';
import type { InputProcessor } from '../types/terminal';

const STILL_IMAGES: readonly GalleryImage[] = Object.freeze([
    { path: 'bot_00.jpg' },
    { path: 'bot_01.jpg' },
    { path: 'bot_02.jpg' },
    { path: 'robot.jpg' },
    { path: 'bot_04.jpg' },
    { path: 'bot_05.jpg' },
]);

export default function CmdViewer() {
    // Keep a fresh ref to inputProcessor so the keyOverride closures (created
    // once in useEffect) can always call the latest setBgImage.
    const inputProcessorRef = useRef<InputProcessor | null>(null);

    const inputProcessor = useRouteInit((ip) => {
        inputProcessorRef.current = ip;

        const config: GalleryConfig<GalleryImage> = {
            images: STILL_IMAGES,
            getImagePath: (item) => {
                const path = `stills/${item.path}`;
                inputProcessorRef.current!.setBgImage(path);
                return path;
            },
            initialResponse: ['<- use arrows to navigate imagery ->', 'ESC to quit'],
        };

        const galleryEnv = createGalleryEnvironment(config);

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            ...galleryEnv,
            activeAppName: 'cmd-viewer',
            displayAppNameInPrompt: true,
            interruptPrompt: true,
        });

        ip.setAppEnvironment(appEnvironment);
        // Display initial image
        inputProcessorRef.current!.setBgImage(`stills/${STILL_IMAGES[0].path}`);
    });

    // Keep ref current on every render so gallery closures always have latest instance.
    inputProcessorRef.current = inputProcessor;

    return null;
}
