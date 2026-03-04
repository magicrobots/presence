import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import AWS from 'aws-sdk';

import environmentHelpers from '../utils/environment-helpers';
import persistence from '../hooks/usePersistence';

// Vite env vars replace Ember's config/environment.js
const ses = new AWS.SES({
    apiVersion: '2010-12-01',
    accessKeyId: import.meta.env.VITE_AWS_ID,
    secretAccessKey: import.meta.env.VITE_AWS_ACCESS,
    region: 'us-east-1',
});

const INIT_MESSAGE = Object.freeze(['Enter a message:', '', 'ESC to quit']);

export default function CmdContact() {
    const inputProcessor = useOutletContext();

    // Keep a fresh ref so scope methods always read the latest state/methods.
    const inputProcessorRef = useRef(null);
    inputProcessorRef.current = inputProcessor;

    // Mutable form state — no need for React re-renders.
    const stepIndexRef = useRef(0);
    const messageBodyRef = useRef('');
    const messageFromRef = useRef('');

    useEffect(() => {
        function resetContact() {
            stepIndexRef.current = 0;
        }

        function sendEmail() {
            inputProcessorRef.current.handleFunctionFromApp(['sending message...']);

            const emailParams = {
                Destination: { ToAddresses: ['Admin <adam@magicrobots.com>'] },
                Message: {
                    Body: { Text: {
                        Data: `${messageBodyRef.current}, from: ${messageFromRef.current}`,
                        Charset: 'UTF-8',
                    }},
                    Subject: { Data: 'Robotified Contact Form', Charset: 'UTF-8' },
                },
                ReplyToAddresses: ['Administrator <adam@magicrobots.com>'],
                Source: `${persistence.getUsername()} <adam@magicrobots.com>`,
            };

            ses.sendEmail(emailParams, function(error) {
                if (error) {
                    inputProcessorRef.current.handleFunctionFromApp([`message sending error: ${error}.`]);
                } else {
                    inputProcessorRef.current.handleFunctionFromApp([
                        'message sent.',
                        '',
                        'ESC to quit, or enter another message.',
                    ]);
                }
                resetContact();
            });
        }

        function handleContactInput(inputString) {
            let appResponse = [...INIT_MESSAGE];

            switch (stepIndexRef.current) {
                case 0:
                    messageBodyRef.current = inputString;
                    appResponse = [
                        'Enter who the message is from:',
                        '[If you\'d like a response, an email address would be helpful here]',
                    ];
                    break;
                case 1:
                    messageFromRef.current = inputString;
                    appResponse = [
                        `MESSAGE: [${messageBodyRef.current}]`,
                        `   FROM: [${messageFromRef.current}]`,
                        '',
                        'Are you sure you want to send the message to Magic Robots HQ?',
                        'y/n',
                    ];
                    break;
                case 2:
                    if (inputString != null) {
                        const response = inputString.toLowerCase();
                        if (['y', 'yes'].includes(response)) {
                            sendEmail();
                            return;
                        }
                    }
                    resetContact();
                    inputProcessorRef.current.handleFunctionFromApp([...INIT_MESSAGE]);
                    return;
                default:
                    appResponse = ['press any key to continue.'];
                    break;
            }

            stepIndexRef.current = stepIndexRef.current + 1;
            inputProcessorRef.current.handleFunctionFromApp(appResponse);
        }

        const scope = {
            // _default is the catch-all for free-form input — receives rawUserEntry
            // before lowercasing so the message body preserves user capitalisation.
            _default(rawInput) {
                handleContactInput(rawInput);
            },
        };

        resetContact();

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-contact',
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: scope,
            response: [...INIT_MESSAGE],
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
