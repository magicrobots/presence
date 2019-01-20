export default {

    generateEnvironmentWithDefaults: function(appName,
        isDisplayInPrompt,
        isInterruptPrompt,
        response,
        keyOverrides,
        overrideScope) {
        return {
            activeAppName: appName || 'index',
            displayAppNameInPrompt: isDisplayInPrompt,
            interruptPrompt: isInterruptPrompt,
            response: response || [':|'],
            keyOverrides,
            overrideScope
        }
    }
}
