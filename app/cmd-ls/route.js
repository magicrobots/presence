import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import MagicNumbers from '../const/magic-numbers';

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

    _getPrunedCommandList(addHiddenItems) {
        const hiddenRejectionTerm = isPresent(addHiddenItems) ? 'nonexistantattributename' : 'isHidden';

        return commandRegistry.registry.rejectBy(hiddenRejectionTerm, true)
            .rejectBy('isInvisible', true)
            .sortBy('commandName');
    },

    _getLongestCommandName(commandList) {
        let longestItem = 0;
        commandList.forEach((currResponseItem) => {
            const currLength = currResponseItem.commandName.length;
            if (currLength > longestItem) {
                longestItem = currLength;
            }
        });

        return longestItem;
    },

    _responseWide(addHiddenItems) {
        const responseItems = this._getPrunedCommandList(addHiddenItems);
        const distanceBetweenItems = 2;
        const longestCommandNameLength = this._getLongestCommandName(responseItems) + distanceBetweenItems;

        let response = '';
        responseItems.forEach((currResponseItem) => {
            const newString = currResponseItem.commandName.padEnd(longestCommandNameLength, ' ');
            response = response.concat(newString);
        });

        return [response];
    },

    _createDetailedLine(appConfigObject) {
        const itemPrefix = '-rw-r--r--';
        const itemPrefixExec = `${MagicNumbers.COLORIZE_LINE_PREFIX}${MagicNumbers.EXEC_COLOR}-rwxr-xr-x`;
        const itemPrefixDir = `${MagicNumbers.COLORIZE_LINE_PREFIX}${MagicNumbers.DIRECTORY_LIST_COLOR}drwxr-xr-x`;
        const prefix = appConfigObject.isExec ? itemPrefixExec :
            appConfigObject.isDir ? itemPrefixDir :
            itemPrefix;
        const suffix = appConfigObject.isDir ? '/' :
            appConfigObject.isExec ? '.exe' : '';

        return prefix.
            concat(' 1 magicrobots ').
            concat(`${appConfigObject.size} `).
            concat(`${appConfigObject.date} `).
            concat(appConfigObject.commandName.concat(suffix));

    },

    _responseTall(addHiddenItems) {
        const responseItems = this._getPrunedCommandList(addHiddenItems);
        const scope = this;

        return responseItems.map((currCommandItem) => {
            return scope._createDetailedLine(currCommandItem);
        });
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: this._getCommandList()
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});