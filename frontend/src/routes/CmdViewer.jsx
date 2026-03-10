import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';

const STILL_IMAGES = Object.freeze([
    'bot_00.jpg',
    'bot_01.jpg',
    'bot_02.jpg',
    'robot.jpg',
    'bot_04.jpg',
    'bot_05.jpg',
]);

export default function CmdViewer() {
    const inputProcessor = useOutletContext();

    // Keep a fresh ref to inputProcessor so the keyOverride closures (created
    // once in useEffect) can always call the latest setBgImage.
    const inputProcessorRef = useRef(null);
    inputProcessorRef.current = inputProcessor;

    // Mutable index that doesn't need to trigger re-renders.
    const currentImgIndexRef = useRef(0);

    useEffect(() => {
        function getImagePath() {
            return `stills/${STILL_IMAGES[currentImgIndexRef.current]}`;
        }

        function displayImage() {
            inputProcessorRef.current.setBgImage(getImagePath());
        }

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-viewer',
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            response: ['<- use arrows to navigate imagery ->', 'ESC to quit'],
            keyOverrides: {
                ARROWLEFT: () => {
                    let newIndex = currentImgIndexRef.current - 1;
                    if (newIndex < 0) { newIndex = STILL_IMAGES.length - 1; }
                    currentImgIndexRef.current = newIndex;
                    displayImage();
                },
                ARROWRIGHT: () => {
                    let newIndex = currentImgIndexRef.current + 1;
                    if (newIndex > STILL_IMAGES.length - 1) { newIndex = 0; }
                    currentImgIndexRef.current = newIndex;
                    displayImage();
                },
            },
            overrideScope: {}
        });

        inputProcessor.setAppEnvironment(appEnvironment);
        displayImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
