export default {
    
    generateEnvironmentWithDefaults: function(appName, isDisplayInPrompt, isInterruptPrompt, response) {
        return {
            activeAppName: appName || 'index',
            displayAppNameInPrompt: isDisplayInPrompt,
            interruptPrompt: isInterruptPrompt,
            response: response || [':|']
        }
    }
}
