import environmentHelpers from "../utils/environment-helpers";

const helpRoute = 'cmd-man';
const helpText = 'Help, and ? are proxies to the MAN command. Enter either of these commands followed by any other command name to get information about that command, and usage instructions if applicable.';
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

    getMatchingCommandFragment(fragment) {
        const listOfCommandNames = this.registry.mapBy('commandName');
        return environmentHelpers.getMatchingFragmentFromSet(fragment, listOfCommandNames);
    },

    registry: [
        { commandName: 'about',
        routeName: 'cmd-about',
        helpText: 'Project description and details.',
        usage: null,
        date: 'Feb  9 14:22',
        size: '       147',
        isExec: true,
        isInvisible: false },

        { commandName: 'beep',
        routeName: 'cmd-beep',
        helpText: 'Communicate with robots using their own language.',
        usage: null,
        date: 'Oct 18 22:04',
        size: '   3332656',
        isExec: false,
        isInvisible: true },

        { commandName: 'cd',
        routeName: 'cmd-cd',
        helpText: 'Move within directory structure.',
        usage: null,
        date: 'Dec 12  4:18',
        size: '    432256',
        isExec: false,
        isInvisible: true },

        { commandName: 'clear',
        routeName: 'cmd-clear',
        helpText: 'Clears the screen of any previous inputs and command responses.',
        usage: null,
        date: 'Dec 30 18:32',
        size: '      2199',
        isExec: false,
        isInvisible: true },

        { commandName: 'contact',
        routeName: 'cmd-contact',
        helpText: 'Write messages to the webmaster.',
        usage: null,
        date: 'Feb  7 12:01',
        size: '    651886',
        isExec: true,
        isInvisible: false },

        { commandName: 'hello',
        routeName: 'cmd-hello',
        helpText: 'Sometimes you just want to say hi.',
        usage: null,
        date: 'Feb 20  6:25',
        size: '      3432',
        isExec: false,
        isInvisible: true },

        { commandName: 'help',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage,
        date: 'Jan  6 22:07',
        size: '  65188319',
        isExec: false,
        isInvisible: true },

        { commandName: 'less',
        routeName: 'cmd-less',
        helpText: 'Used to view but not change the contents of a text file.',
        usage: null,
        date: 'Feb  3  7:45',
        size: '    198516',
        isExec: true,
        isInvisible: true },

        { commandName: 'ls',
        routeName: 'cmd-ls',
        helpText: 'List command shows user available commands in the system.',
        usage: null,
        date: 'Feb  3  7:45',
        size: '    198516',
        isExec: false,
        isInvisible: true },

        { commandName: 'man',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage,
        date: 'Nov 16  7:39',
        size: '       484',
        isExec: false,
        isInvisible: true },

        { commandName: 'pwd',
        routeName: 'cmd-pwd',
        helpText: 'Print Working Directory: informs user of current position in directory structure.',
        usage: null,
        date: 'Feb  9 14:22',
        size: '       235',
        isExec: false,
        isInvisible: true },

        { commandName: 'stills',
        routeName: 'cmd-stills',
        helpText: 'Displays still images taken off modern VHS tapes.',
        usage: 'Use left and right arrows to navigate, and ESC to exit.',
        date: 'Feb  9 16:02',
        size: '9819081510',
        isExec: true,
        isInvisible: false },

        { commandName: 'settings',
        routeName: 'cmd-settings',
        helpText: 'Allows user to save personal settings for terminal environment.',
        usage: 'At settings prompt >`username Eloise`',
        date: 'Jan 16  6:05',
        size: '      5191',
        isExec: true,
        isInvisible: false },

        { commandName: 'story',
        routeName: 'cmd-story',
        helpText: 'A text based interactive adventure.',
        usage: null,
        date: 'Mar  1 14:41',
        size: '      7394',
        isExec: true,
        isInvisible: false },

        { commandName: 'shop',
        routeName: 'cmd-shop',
        helpText: 'Displays gallery of things you can buy. And some things you can\'t.',
        usage: 'Use left and right arrows to navigate, and ESC to exit.',
        date: 'Apr 18 21:30',
        size: '0824054527',
        isExec: true,
        isInvisible: false },

        { commandName: 'whoami',
        routeName: 'cmd-whoami',
        helpText: 'Prints current active username.',
        usage: null,
        date: 'Dec 20  6:47',
        size: '    511190',
        isExec: false,
        isInvisible: true },

        { commandName: '?',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage,
        date: 'Nov 22 16:42',
        size: '       486',
        isExec: false,
        isInvisible: true },

        // ----------------- hidden thangs

        { commandName: '.',
            date: 'Jan  2  3:42',
            size: '         0',
            isHidden: true,
            isDir: true },

        { commandName: '..',
            date: 'Jan 16 23:18',
            size: '         0',
            isHidden: true,
            isDir: true },

        { commandName: '.config',
            date: 'Dec 18  1:17',
            size: '      6581',
            isHidden: true,
            isExec: false,
            content: [
                '<Project DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">',
                '<PropertyGroup>',
                '<AssemblyName>MSBuildSample</AssemblyName>',
                '<OutputPath>Bin\</OutputPath>',
                '</PropertyGroup>',
                '<ItemGroup>',
                '<Compile Include="helloworld.cs" />',
                '</ItemGroup>',
                '<Target Name="Build">',
                '<MakeDir Directories="$(OutputPath)" Condition="!Exists(`$(OutputPath)`)" />',
                '<Csc Sources="@(Compile)" OutputAssembly="$(OutputPath)$(AssemblyName).exe" />',
                '</Target><Target Name="Clean" >',
                '<Delete Files="$(OutputPath)$(AssemblyName).exe" />',
                '</Target>',
                '<Target Name="Rebuild" DependsOnTargets="Clean;Build" />',
                '</Project>'
            ] },

        { commandName: '.core-dump',
            date: 'Nov 13 21:33',
            size: '   2463722',
            isHidden: true,
            isExec: false,            
            content: ['00111001001101100011000000111000001101110110011001100001011000100011010001100101001101100011001101100010001101010011010100110111001101010110000101100001001100110011011100110111001101000110011000110110001110010110010000111001011001010110010000110001001100010011010000111000001110010110011000110100001100010011001100110010011001010011100100110011001101100011100101100101001101000011000000110111001101110011100100110111011000110011100000110001011001100011100001100100001101000110010001100011011000100110010101100101...']},

        { commandName: 'mainframe.key',
            date: 'Feb 19 10:47',
            size: '  65815239',
            isHidden: true,
            isExec: false,
            content: ['57de30e7da3fc3d851342996ef0e6d7f951d6ecc997f95487c7ad22cb8661046']},

        { commandName: 'recovered-map.jpg',
            date: 'Feb 28  9:57',
            size: '     46221',
            isHidden: true,
            isExec: false,
            content: ['[Object][jpg data]']},
    ]
}