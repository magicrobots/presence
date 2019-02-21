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
    }
}
