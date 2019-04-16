export default {

    generateEnvironmentWithDefaults: function(options) {
        return {
            activeAppName: options.activeAppName || 'index',
            displayAppNameInPrompt: options.displayAppNameInPrompt,
            interruptPrompt: options.interruptPrompt,
            response: options.response || ['no application response provided'],
            keyOverrides: options.keyOverrides,
            overrideScope: options.overrideScope
        }
    },

    getRandomResponseFromList(list) {
        const randomResponseIndex = Math.floor(Math.random() * list.length);

        return list[randomResponseIndex];
    },

    getMatchingFragmentFromSet(fragment, set) {
        const testEntry = fragment.toUpperCase();

        const matches = set.filter((currCmdDef) => {
            const currCommandUpper = currCmdDef.toUpperCase();
            if(currCommandUpper.indexOf(testEntry) === 0) {
                return true;
            }
        });

        return matches.length === 1 ? matches[0] : null;
    }
}
