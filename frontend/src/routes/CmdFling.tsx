import { useRef } from 'react';

import environmentHelpers from '../utils/environment-helpers';
import persistence from '../utils/persistence';
import { useRouteInit } from './shared/useRouteInit';
import type { InputProcessor } from '../types/terminal';

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const MISSING_INPUT_PREFIX = '  ERROR: Missing required input: ';
const WIND_DIRECTION_BEHIND = 1;
const WIND_DIRECTION_AGAINST = -1;

interface Command {
    cmdName: string;
    description: string;
}

interface Animal {
    name: string;
    weight: number;
    airResistance: number;
    exclamation: string;
    waver: string;
    lander: string;
    landInteraction: string;
}

const COMMANDS: readonly Command[] = Object.freeze([
    { cmdName: 'fling',   description: 'fling stuff' },
    { cmdName: 'target',  description: 'display environmental variables' },
    { cmdName: 'critters', description: 'list launchable animals' },
    { cmdName: 'new',     description: 'initialize new environment' },
    { cmdName: 'stats',   description: 'view your flinging abilities represented as numbers' },
]);

// weight scale: worm=1, elephant=100   air resistance scale: bullet=1, feather=100
const ANIMALS: readonly Animal[] = Object.freeze([
    { name: 'chicken', weight: 8,  airResistance: 50, exclamation: 'BUKAAAAAAAARK!',        waver: 'wings',       lander: 'face',  landInteraction: 'careens' },
    { name: 'piglet',  weight: 16, airResistance: 25, exclamation: 'SQUEEEEEEEEEEE!',        waver: 'legs',        lander: 'snout', landInteraction: 'rolls'   },
    { name: 'turkey',  weight: 24, airResistance: 47, exclamation: 'GOBBLEGOBBLEGOBBLE!',    waver: 'floppy neck', lander: 'claws', landInteraction: 'scrabbles' },
    { name: 'ant',     weight: 1,  airResistance: 86, exclamation: 'eeeee!',                 waver: 'little legs', lander: 'feet',  landInteraction: 'slides'  },
    { name: 'salmon',  weight: 26, airResistance: 2,  exclamation: 'squish!',                waver: 'fins',        lander: 'side',  landInteraction: 'slips'   },
]);

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function CmdFling() {
    // Keep a fresh ref so scope methods always read the latest state/methods.
    const inputProcessorRef = useRef<InputProcessor | null>(null);

    // Mutable game state — no need for React re-renders.
    const windRef = useRef({ velocity: 0, direction: WIND_DIRECTION_BEHIND });
    const distanceToTargetRef = useRef(0);
    const tryCounterRef = useRef(0);

    const inputProcessor = useRouteInit((ip) => {
        inputProcessorRef.current = ip;

        function getWindDescription() {
            const wind = windRef.current;
            let directionDescription = wind.direction === WIND_DIRECTION_BEHIND
                ? ' at your back'
                : ' in your face';

            if (wind.velocity === 0) { directionDescription = ''; }

            const pluralizer = wind.velocity === 1 ? '' : 's';
            return `${wind.velocity} knot${pluralizer}${directionDescription}.`;
        }

        function showTarget() {
            return `Distance to target: ${distanceToTargetRef.current} meters, wind: ${getWindDescription()}`;
        }

        function showCommands() {
            const longestCommand = COMMANDS.map(cmd => cmd.cmdName.length + cmd.description.length)
                .sort((a, b) => a - b)[0];

            return ['COMMANDS:'].concat(COMMANDS.map(cmd =>
                ` - ${cmd.cmdName.padEnd(longestCommand, '.')}${cmd.description}`
            ));
        }

        function doFling(animal: Animal, effort: number): string[] {
            const windChillFactor = 0.03;
            const windAdjustment = windRef.current.velocity *
                windRef.current.direction *
                animal.airResistance *
                windChillFactor;
            const rawDistance = Math.sqrt(2 * effort) * (1 / animal.weight) * 100;
            const distance = Math.round(rawDistance + windAdjustment);
            const diff = Math.abs(distanceToTargetRef.current - distance);

            const introSet = [
                'TCHK! the latch releases',
                'With a CHNK the catapult activates',
                'Everyone eating their cotton candy is startled by a loud CLANK',
            ];
            const landingSet = [
                'After what seems like far too long',
                'A few moments later',
                'Finally',
            ];

            const intro = environmentHelpers.getRandomResponseFromList(introSet);
            const preLanding = environmentHelpers.getRandomResponseFromList(landingSet);

            let response: string[] = [
                'There is a moment of quiet.',
                '',
                `${intro} and "${animal.exclamation}" the ${animal.name} flies skyward, its ${animal.waver} waving helplessly in the air.`,
                '',
                `${preLanding}, the ${animal.name} lands square on its ${animal.lander} and ${animal.landInteraction} for a few meters before coming to a stop ${distance} meters away.`,
                '',
                `That's ${diff} meters from the target.`,
            ];

            if (diff < 10) {
                if (diff === 0) {
                    const oldRecord = persistence.getFlingRecord();
                    if (oldRecord != null && oldRecord > tryCounterRef.current) {
                        persistence.setFlingRecord(tryCounterRef.current);
                    }
                    response = response.concat(['SO CRAZY!!! HOLE IN ONE!']);
                    scope.new(); // start a new round
                } else {
                    response = response.concat(['DAAAAAAAAAAAAAMN so close.']);
                }
            }

            return response;
        }

        const scope = {
            help() {
                inputProcessorRef.current!.handleFunctionFromApp(showCommands());
            },

            stats() {
                const oldRecord = persistence.getFlingRecord();
                const responseBase = 'Number of tries till perfect fling:';
                if (oldRecord != null) {
                    inputProcessorRef.current!.handleFunctionFromApp([`${responseBase} ${oldRecord}`, 'Nice.']);
                } else {
                    inputProcessorRef.current!.handleFunctionFromApp([
                        `${responseBase} N/A`,
                        'You have yet to achieve a perfect fling. Keep at it, I have faith in you.',
                    ]);
                }
            },

            critters() {
                inputProcessorRef.current!.handleFunctionFromApp(
                    ANIMALS.map(critter =>
                        `${critter.name} [ weight: ${critter.weight}, air resistance: ${critter.airResistance} ]`
                    )
                );
            },

            new() {
                const maxWind = 20;
                const maxDistance = 200;
                const minDistance = 23;

                tryCounterRef.current = 0;

                windRef.current = {
                    velocity: Math.round(Math.random() * maxWind),
                    direction: Math.random() > 0.5 ? WIND_DIRECTION_AGAINST : WIND_DIRECTION_BEHIND,
                };

                const variability = maxDistance - minDistance;
                distanceToTargetRef.current = minDistance + Math.round(Math.random() * variability);

                scope.target();
            },

            target() {
                inputProcessorRef.current!.handleFunctionFromApp([showTarget()]);
            },

            fling(args: string[] = []) {
                const animalName = args[0];
                const effort = args[1];

                tryCounterRef.current = tryCounterRef.current + 1;

                if (animalName == null) {
                    inputProcessorRef.current!.handleFunctionFromApp([
                        `${MISSING_INPUT_PREFIX} animal you want to fling, effort value.`
                    ]);
                    return;
                }

                const matchedAnimal = ANIMALS.find(a => a.name === animalName);
                if (matchedAnimal == null) {
                    inputProcessorRef.current!.handleFunctionFromApp([
                        `Sorry, we don't have a ${animalName} in the flingagerie yet.`
                    ]);
                    return;
                }

                if (effort == null || isNaN(Number(effort))) {
                    inputProcessorRef.current!.handleFunctionFromApp([
                        `${MISSING_INPUT_PREFIX} effort value as number.`
                    ]);
                    return;
                }

                inputProcessorRef.current!.handleFunctionFromApp(doFling(matchedAnimal, Number(effort)));
            },

            commandComplete(fragment: string) {
                const commandRegistry = COMMANDS.map(c => c.cmdName);
                const critterList = ANIMALS.map(a => a.name);
                return environmentHelpers.handleTabComplete(fragment, [commandRegistry, critterList]);
            },
        };

        // init() equivalent — run new() before setting environment (mirrors Ember init hook)
        scope.new();

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-fling',
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: scope,
            response: [
                'Winding back catapult arm...',
                '',
                showTarget(),
                '',
                ...showCommands(),
            ],
        });

        ip.setAppEnvironment(appEnvironment);
    });

    // Keep ref current on every render so scope closures always have latest instance.
    inputProcessorRef.current = inputProcessor;

    return null;
}
