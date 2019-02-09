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
        { commandName: 'about',
        routeName: 'cmd-about',
        helpText: 'This command tells the user about this computer internet project.',
        usage: null,
        date: 'Feb  9 14:22',
        size: '       147',
        isExec: false,
        hideFromList: false },

        { commandName: 'cd',
        routeName: 'cmd-cd',
        helpText: 'Move withing directory structure.',
        usage: null,
        date: 'Dec 12  4:18',
        size: '    432256',
        isExec: false,
        hideFromList: true },

        { commandName: 'whoami',
        routeName: 'cmd-whoami',
        helpText: 'Prints current active username.',
        usage: null,
        date: 'Dec 20  6:47',
        size: '    511190',
        isExec: false,
        hideFromList: true },

        { commandName: 'pwd',
        routeName: 'cmd-pwd',
        helpText: 'Print Working Directory: informs user of current position in directory structure.',
        usage: null,
        date: 'Feb  9 14:22',
        size: '       235',
        isExec: false,
        hideFromList: true },

        { commandName: 'contact',
        routeName: 'cmd-contact',
        helpText: 'This command shows the user different ways to see other things the author of this project has created or ways to get in touch with them if the user so chooses.',
        usage: 'contact instagram',
        date: 'Feb  7 12:01',
        size: '    651886',
        isExec: false,
        hideFromList: false },

        { commandName: 'ls',
        routeName: 'cmd-ls',
        helpText: 'This is a list command which shows the user available commands or applications in the system.',
        usage: null,
        date: 'Feb  3  7:45',
        size: '    198516',
        isExec: false,
        hideFromList: false },

        { commandName: 'clear',
        routeName: 'cmd-clear',
        helpText: 'This command clears the screen of any previous inputs and command responses.',
        usage: null,
        date: 'Dec 30 18:32',
        size: '      2199',
        isExec: false,
        hideFromList: true },

        { commandName: 'help',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage,
        date: 'Jan  6 22:07',
        size: '  65188319',
        isExec: false,
        hideFromList: true },

        { commandName: 'man',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage,
        date: 'Nov 16  7:39',
        size: '       484',
        isExec: false,
        hideFromList: false },

        { commandName: '?',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage,
        date: 'Nov 22 16:42',
        size: '       486',
        isExec: false,
        hideFromList: true },

        { commandName: 'robots',
        routeName: 'cmd-robots',
        helpText: 'This application displays still images taken off modern VHS tapes.',
        usage: 'Use left and right arrows to navigate, and q to exit.',
        date: 'Feb  9 16:02',
        size: '9819081510',
        isExec: true,
        hideFromList: false },

        { commandName: 'settings',
        routeName: 'cmd-settings',
        helpText: 'This application allows the user to save personal settings.',
        usage: 'set username fred',
        date: 'Jan 16  6:05',
        size: '      5191',
        isExec: true,
        hideFromList: false }
    ]
}