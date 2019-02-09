import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    // extra fun stuff for -a
    hiddenItems: Object.freeze([
        { commandName: './',
            date: 'Jan  2  3:42',
            size: '         0',
            isExec: true },
        { commandName: '../',
            date: 'Jan 16 23:18',
            size: '         0',
            isExec: true },
        { commandName: '.config',
            date: 'Dec 18  1:17',
            size: '      6581',
            isExec: false },
        { commandName: '.mainframe.key',
            date: 'Feb 19 10:47',
            size: '  65815239',
            isExec: false },
        { commandName: '.core-dump',
            date: 'Nov 13 21:33',
            size: '         0',
            isExec: true }
        ]),

    _getCommandList() {
        let commandList = [];
        let listArg = isPresent(this.inputProcessor.currentArgs) ?
            this.inputProcessor.currentArgs[0] :
            null;

        switch(listArg) {
            case '-la':
                commandList = this._responseTall(true);
                break;
            case '-a':
                commandList = this._responseWide(true);
                break;
            case '-l':
                commandList = this._responseTall();
                break;
            default:
                commandList = this._responseWide();
                break;
        }

        return commandList;
    },

    _responseWide(addHiddenItems) {
        const responseItems = isPresent(addHiddenItems) ? this.hiddenItems.map((currHiddenItem) => {
            return currHiddenItem.commandName;
        }) : [];

        commandRegistry.registry.forEach((currCmdDef) => {
            if(!currCmdDef.hideFromList) {
                responseItems.push(currCmdDef.commandName);
            }
        });

        // find longest item to create spacing
        let longestItem = 0;
        responseItems.forEach((currResponseItem) => {
            const currLength = currResponseItem.length;
            if (currLength > longestItem) {
                longestItem = currLength;
            }
        });

        // create response string
        const distanceBetweenItems = 2;
        let response = '';
        responseItems.forEach((currResponseItem) => {
            const newString = currResponseItem.padEnd(longestItem + distanceBetweenItems, ' ');
            response = response.concat(newString);
        });

        return [response];
    },

    _createDetailedLine(appConfigObject) {
        const itemPrefix = '-rw-r--r--';
        const itemPrefixExec = 'drwxr-xr-x';
        const prefix = appConfigObject.isExec ? itemPrefixExec : itemPrefix;

        return prefix.
            concat(' 1 magicrobots ').
            concat(`${appConfigObject.size} `).
            concat(`${appConfigObject.date} `).
            concat(appConfigObject.commandName);

    },

    _responseTall(addHiddenItems) {
        let response = [];
        const scope = this;

        if (isPresent(addHiddenItems)) {
            response = this.hiddenItems.map((currHiddenItem) => {
                return scope._createDetailedLine(currHiddenItem);
            });            
        }

        commandRegistry.registry.forEach((currCmdDef) => {
            if(!currCmdDef.hideFromList) {
                const currLine = scope._createDetailedLine(currCmdDef);

                response = response.concat(currLine);
            }
        });

        return response;
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: this._getCommandList()
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});