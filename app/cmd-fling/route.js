import Route from '@ember/routing/route';
import { isNone, isPresent } from '@ember/utils';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import environmentHelpers from '../utils/environment-helpers';

const MISSING_INPUT_PREFIX = '  ERROR: Missing required input: ';
const WIND_DIRECTION_BEHIND = 1;
const WIND_DIRECTION_AGAINST = -1;
const COMMANDS = [
    {
        cmdName: 'fling',
        description: 'fling stuff'
    },
    {
        cmdName: 'target',
        description: 'display environmental variables'
    },
    {
        cmdName: 'critters',
        description: 'list launchable animals'
    },
    {
        cmdName: 'new',
        description: 'initialize new environment'
    },
    {
        cmdName: 'stats',
        description: 'view your flinging abilities represented as numbers'
    }
];

// weight is using the scale: worm: 1, elephant: 100
// air resistance is using the scale: bullet 1, feather: 100
const ANIMALS = [
    {
        name: 'chicken',
        weight: 8,
        airResistance: 50,
        exclamation: 'BUKAAAAAAAARK!',
        waver: 'wings',
        lander: 'face',
        landInteraction: 'careens'
    },
    {
        name: 'piglet',
        weight: 16,
        airResistance: 25,
        exclamation: 'SQUEEEEEEEEEEE!',
        waver: 'legs',
        lander: 'snout',
        landInteraction: 'rolls'
    },
    {
        name: 'turkey',
        weight: 24,
        airResistance: 47,
        exclamation: 'GOBBLEGOBBLEGOBBLE!',
        waver: 'floppy neck',
        lander: 'claws',
        landInteraction: 'scrabbles'
    },
    {
        name: 'ant',
        weight: 1,
        airResistance: 86,
        exclamation: 'eeeee!',
        waver: 'little legs',
        lander: 'feet',
        landInteraction: 'slides'
    },
    {
        name: 'salmon',
        weight: 26,
        airResistance: 2,
        exclamation: 'squish!',
        waver: 'fins',
        lander: 'side',
        landInteraction: 'slips'
    }
]

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),

    init() {
        this._super(...arguments);

        this.new();
    },

    _showTarget() {
        return `Distance to target: ${this.distanceToTarget} meters, wind: ${this._getWindDescription()}`;
    },

    _showCommands() {

        // Get length of longest command + description
        const longestCommand = COMMANDS.map(command => {
            return command.cmdName.length + command.description.length;
        }).sort(function(a, b){return a-b})[0];

        return ['COMMANDS:'].concat(COMMANDS.map(command => {
            return ` - ${command.cmdName.padEnd(longestCommand, '.')}${command.description}`;
        }));
    },

    _getWindDescription() {
        let directionDescription = this.wind.direction === WIND_DIRECTION_BEHIND ?
            ' at your back' :
            ' in your face';

        // no need to describe direction if it's zero
        if (this.wind.velocity === 0) {
            directionDescription = '';
        }

        const pluralizer = this.wind.velocity === 1 ? '' : 's';

        return `${this.wind.velocity} knot${pluralizer}${directionDescription}.`;
    },

    _doFling(animal, effort) {
        const windChillFactor = .03;
        const windAdjustment = this.wind.velocity *
            this.wind.direction *
            animal.airResistance *
            windChillFactor;
        const rawDistance = Math.sqrt(2 * effort) * (1 / animal.weight) * 100;
        const distance = Math.round(rawDistance + windAdjustment);
        const diff = Math.abs(this.distanceToTarget - distance);

        const introSet = [
            'TCHK! the latch releases',
            'With a CHNK the catapult activates',
            'Everyone eating their cotton candy is startled by a loud CLANK'
        ];

        const landingSet = [
            'After what seems like far too long',
            'A few moments later',
            'Finally'
        ];

        // choose random bits
        const intro = environmentHelpers.getRandomResponseFromList(introSet);
        const preLanding = environmentHelpers.getRandomResponseFromList(landingSet);

        // compile text
        let response = [
            'There is a moment of quiet.',
            '',
            `${intro} and "${animal.exclamation}" the ${animal.name} flies skyward, its ${animal.waver} waving helplessly in the air.`,
            '',
            `${preLanding}, the ${animal.name} lands square on its ${animal.lander} and ${animal.landInteraction} for a few meters before coming to a stop ${distance} meters away.`,
            '',
            `That's ${diff} meters from the target.`
        ];

        // Feedback? store achievements?
        if (diff < 10) {
            if (diff === 0) {
                // Store count if it's lower than before
                const oldRecord = this.persistenceHandler.getFlingRecord();
                if (isPresent(oldRecord) &&
                    oldRecord > this.tryCounter) {
                        this.persistenceHandler.setFlingRecord(this.tryCounter);
                }

                response = response.concat(['SO CRAZY!!! HOLE IN ONE!']);
                this.new();
            } else {
                response = response.concat(['DAAAAAAAAAAAAAMN so close.']);
            }
        }

        return response;
    },

    help() {
        this.inputProcessor.handleFunctionFromApp(this._showCommands());
    },

    stats() {
        const oldRecord = this.persistenceHandler.getFlingRecord();
        const responseBase = 'Number of tries till perfect fling:';

        if (isPresent(oldRecord)) {
            this.inputProcessor.handleFunctionFromApp([`${responseBase} ${oldRecord}`, 'Nice.']);
        } else {
            this.inputProcessor.handleFunctionFromApp([`${responseBase} N/A`, 'You have yet to achieve a perfect fling. Keep at it, I have faith in you.']);
        }
    },

    critters() {
        this.inputProcessor.handleFunctionFromApp(ANIMALS.map(critter => {
            return `${critter.name} [ weight: ${critter.weight}, air resistance: ${critter.airResistance} ]`;
        }));
    },

    new() {
        const maxWind = 20;
        const maxDistance = 200;
        const minDistance = 23;

        // init try counter
        set(this, 'tryCounter', 0);

        // set wind
        set(this, 'wind', {
            velocity: Math.round(Math.random() * maxWind),
            direction: Math.random() > 0.5 ?
                WIND_DIRECTION_AGAINST :
                WIND_DIRECTION_BEHIND
        });

        // set distance to target
        const variability = maxDistance - minDistance;
        const newDistance = minDistance + Math.round(Math.random() * variability);
        set(this, 'distanceToTarget', newDistance);

        // display result
        this.target();
    },

    target() {
        this.inputProcessor.handleFunctionFromApp([this._showTarget()]);
    },

    fling() {
        const args = this.inputProcessor.currentArgs;
        const animal = args[0];
        const effort = args[1];

        // increment trycounter
        const newTryCounter = this.tryCounter + 1;
        set(this, 'tryCounter', newTryCounter);

        // make sure they entered an animal
        if (isNone(animal)) {
            this.inputProcessor.handleFunctionFromApp([`${MISSING_INPUT_PREFIX} animal you want to fling, effort value.`]);
            return;
        }

        // check animal validity
        const matchedAnimal = ANIMALS.findBy('name', animal);
        if (isNone(matchedAnimal)) {
            this.inputProcessor.handleFunctionFromApp([`Sorry, we don't have a ${animal} in the flingagerie yet.`]);
            return;
        }

        // make sure they entered an effort
        if (isNone(effort) || isNaN(effort)) {
            this.inputProcessor.handleFunctionFromApp([`${MISSING_INPUT_PREFIX} effort value as number.`]);
            return;
        }

        this.inputProcessor.handleFunctionFromApp(this._doFling(matchedAnimal, effort));
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: this,
            response: ['Winding back catapult arm...',
                '',
                this._showTarget(),
                ''
                ].concat(this._showCommands())
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    },

    commandComplete(fragment) {
        const commandRegistry = COMMANDS.mapBy('cmdName');
        const critterList = ANIMALS.mapBy('name');

        return environmentHelpers.handleTabComplete(fragment, [commandRegistry, critterList]);
    }
});