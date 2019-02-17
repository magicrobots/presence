import Route from '@ember/routing/route';
import { computed, aliasMethod } from '@ember/object';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),
    storyCore: service(),

    welcomeMessage: computed('storyCore.XP', {
        get() {
            return this.persistenceHandler.getGameXP() > 0 ?
                'Welcome back.' :
                'Welcome to story.';
        }
    }),

    walk: aliasMethod('go'),

    move: aliasMethod('go'),

    go() {
        let chosenDirection = null;

        // find direction user requests
        for (let i = 0; i < this.inputProcessor.currentArgs.length; i++ ) {
            const currArg = this.inputProcessor.currentArgs[i];
            for (let j = 0; j < this.storyCore.getExitPossibilities().length; j++ ) {
                const currExit = this.storyCore.getExitPossibilities()[j];
                if (currArg.toUpperCase() === currExit.abbr ||
                    currArg.toUpperCase() === currExit.word ) {
                        chosenDirection = currExit;
                }
            }
        }

        // if it's a valid direction, update position
        if (this.storyCore.isValidDirection(chosenDirection)) {
            this.storyCore.handlePositionChange(chosenDirection);
            this.inputProcessor.handleFunctionFromApp(this.storyCore.getCurrentRoomDescription());
        } else {
            this.inputProcessor.handleFunctionFromApp(['you can\'t go that way.']);
        }

        this.storyCore.reportGameData();
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: this,
            response: [this.welcomeMessage].concat(this.storyCore.getCurrentRoomDescription())
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
        this.storyCore.reportGameData();
    },

    formatGameData() {
        // resets game
        this.storyCore.formatGameData();
        this.inputProcessor.handleFunctionFromApp([this.welcomeMessage].concat(this.storyCore.getCurrentRoomDescription()));
        this.storyCore.reportGameData();
    }
});
