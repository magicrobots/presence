import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isPresent, isNone } from '@ember/utils';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import MagicNumbers from '../const/magic-numbers';

export default Route.extend({
    inputProcessor: service(),

    _listResponse() {
        let listArg = isPresent(this.inputProcessor.currentArgs) ?
            this.inputProcessor.currentArgs[0] :
            null;

        // plain entry no arguments
        if (isNone(listArg)) {
            return this._responseWide();

        // process args
        } else if (isPresent(listArg) && listArg.charAt(0) === '-') {
            const isTall = listArg.indexOf('l') > -1;

            return isTall ?
                this._responseTall(listArg) :
                this._responseWide(listArg);

        // process args with no dash
        } else {
            return (this._handleNonModifierArgument(listArg));
        }
    },

    _handleNonModifierArgument(listArg) {
        // deny access to directories
        if (commandRegistry.getIsDirectory(listArg) || listArg.indexOf('/') > -1) {
            return [`ls: ACCESS DENIED (${listArg})`];

        // display files etc. typed in
        } else if (isPresent(commandRegistry.getMatchingCommand(listArg)) &&
            !commandRegistry.getIsInvisible(listArg)) {

            return [listArg];
        }

        return [`ls: cannot access '${listArg}': No such file or directory`];
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

    _responseTall(listArg) {
        const addHiddenItems = !listArg || listArg.indexOf('a') === -1 ? null : true;
        const responseItems = this._getPrunedCommandList(addHiddenItems);
        const scope = this;

        return responseItems.map((currCommandItem) => {
            return scope._createDetailedLine(currCommandItem);
        });
    },

    _responseWide(listArg) {
        const addHiddenItems = !listArg || listArg.indexOf('a') === -1 ? null : true;
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

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: this._listResponse()
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});