const helpRoute = 'cmd-help';
const helpText = 'MAN, and ? are proxies to the HELP command. Type either of these commands followed by any other command name to get information about that command, and usage instructions if applicable.';
const helpUsage = 'man contact';

export default {

    getMatchingCommand(command) {
        const testCommandName = command.toUpperCase();

        return this.registry.filter((currCmdDef) => {
            if(currCmdDef.commandName.toUpperCase() === testCommandName) {
                return true;
            }
        })[0];
    },

    registry: [
        {commandName: 'about',
        routeName: 'cmd-about',
        helpText: 'This command tells the user about this computer internet project.' },

        {commandName: 'contact',
        routeName: 'cmd-contact',
        helpText: 'This command shows the user different ways to see other things the author of this project has created or ways to get in touch with them if the user so chooses.',
        usage: 'contact instagram'},

        {commandName: 'ls',
        routeName: 'cmd-ls',
        helpText: 'This is a list command which shows the user all available commands or applications in the system.'},

        {commandName: 'clear',
        routeName: 'cmd-clear',
        helpText: 'This command clears the screen of any previous inputs and command responses.'},

        {commandName: 'help',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage},

        {commandName: 'man',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage},

        {commandName: '?',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage},

        {commandName: 'robots',
        routeName: 'cmd-robots',
        helpText: 'This application displays still images taken off modern VHS tapes.',
        usage: 'Use left and right arrows to navigate, and q to exit.'},

        {commandName: 'settings',
        routeName: 'cmd-settings',
        helpText: 'This application allows the user to save personal settings.',
        usage: 'set username fred'}
    ]
}