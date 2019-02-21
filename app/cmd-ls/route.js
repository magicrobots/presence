import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

import commandRegistry from '../const/command-registry';
import hiddenItems from '../const/hidden-items';
import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    _getCommandList() {
        let commandList = [];
        let listArg = isPresent(this.inputProcessor.currentArgs) ?
            this.inputProcessor.currentArgs[0] :
            null;

        switch(listArg) {
            case '-al':
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
        const responseItems = isPresent(addHiddenItems) ? hiddenItems.commands.map((currHiddenItem) => {
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
        const itemPrefixExec = `${this.inputProcessor.COLORIZE_LINE_PREFIX}${this.inputProcessor.DIRECTORY_LIST_COLOR}drwxr-xr-x`;
        const prefix = appConfigObject.isExec ? itemPrefixExec : itemPrefix;
        const suffix = appConfigObject.isExec ? '/' : '';

        return prefix.
            concat(' 1 magicrobots ').
            concat(`${appConfigObject.size} `).
            concat(`${appConfigObject.date} `).
            concat(appConfigObject.commandName.concat(suffix));

    },

    _responseTall(addHiddenItems) {
        let response = [];
        const scope = this;

        if (isPresent(addHiddenItems)) {
            response = hiddenItems.commands.map((currHiddenItem) => {
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