import Route from '@ember/routing/route';
import { computed, aliasMethod } from '@ember/object';
import { isNone } from '@ember/utils';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),
    storyCore: service(),

    // ------------------- computed properties -------------------

    welcomeMessage: computed('storyCore.XP', {
        get() {
            return this.isNewStory ?
                'Welcome to story.' :
                'Welcome back.';
        }
    }),

    isNewStory: computed('persistenceHandler.magicRobotsData.story-xp', {
        get() {
            return isNone(this.persistenceHandler.getStoryXP());
        }
    }),

    // ------------------- public methods -------------------

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

        this.storyCore.reportStoryData();
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: this,
            response: [this.welcomeMessage].concat(this.storyCore.getCurrentRoomDescription())
        });

        // handle initialization of story data if it doesn't exist yet
        if (this.isNewStory) {
            this.formatStoryData();
        }

        // init story in shell
        this.inputProcessor.setAppEnvironment(appEnvironment);
        this.storyCore.reportStoryData();
    },

    formatStoryData() {
        // resets story
        this.storyCore.formatStoryData();
        this.inputProcessor.handleFunctionFromApp([this.welcomeMessage].concat(this.storyCore.getCurrentRoomDescription()));
        this.storyCore.reportStoryData();
    }
});
