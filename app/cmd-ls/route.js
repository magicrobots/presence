import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isPresent, isNone } from '@ember/utils';
import { set } from '@ember/object';

import commandRegistry from '../const/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import MagicNumbers from '../const/magic-numbers';

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),

    _listResponse() {
        const rawArgs = this.inputProcessor.rawUserEntry.split(' ')[1];
        set(this, 'lsArgs', rawArgs || null);

        // ls ./ is same as ls
        if (this.lsArgs === './' || this.lsArgs === '.') {
            const nextArgs = this.inputProcessor.rawUserEntry.split(' ')[2];
            set(this, 'lsArgs', nextArgs || null);
        }
        
        const addHiddenItems = this._hasArg('a');
        let commandList = this._getPrunedCommandList(addHiddenItems);

        // do sorts
        if (this._hasArg('S')) {
            commandList = commandList.sortBy('size').reverse();
        }
        if (this._hasArg('t')) {
            commandList = commandList.sortBy('date').reverse();
        }
        if (this._hasArg('r')) {
            commandList.reverse();
        }

        // plain entry no arguments
        if (isNone(this.lsArgs)) {
            return this._responseWide(commandList);

        // process args
        } else if (this._hasArg('-')) {

            return this._hasArg('l') || this._hasArg('n') ?
                this._responseTall(commandList) :
                this._responseWide(commandList);

        // process args with no dash
        } else {
            return (this._handleNonModifierArgument());
        }
    },

    _hasArg(pChar) {
        return !this.lsArgs || this.lsArgs.indexOf(pChar) === -1 ? null : true;
    },

    _handleNonModifierArgument() {
        // deny access to directories
        if (commandRegistry.getIsDirectory(this.lsArgs) || this.lsArgs.indexOf('/') > -1) {
            return [`ls: ACCESS DENIED (${this.lsArgs})`];

        // display files etc. typed in
        } else if (isPresent(commandRegistry.getMatchingCommand(this.lsArgs)) &&
            !commandRegistry.getIsInvisible(this.lsArgs)) {

            return [this.lsArgs];
        }

        return [`ls: cannot access '${this.lsArgs}': No such file or directory`];
    },

    _getPrunedCommandList(addHiddenItems) {
        const hiddenRejectionTerm = isPresent(addHiddenItems) ? 'nonexistantattributename' : 'isHidden';

        return commandRegistry.registry.rejectBy(hiddenRejectionTerm, true)
            .rejectBy('isInvisible', true)
            .sortBy('commandName');
    },

    _getOwner(appConfigObject, longstName) {
        const hardlinks = Math.ceil(Math.random() * 5);
        const owner = appConfigObject.owner || { uname: this.persistenceHandler.getUsername(), uid:'1000'};
        return ` ${hardlinks} ${this._hasArg('n') ? owner.uid.padStart(4) : owner.uname.padStart(longstName)} `;
    },

    _createDetailedLine(appConfigObject, longestSize, longstName) {
        const itemPrefix = '-rw-r--r--';
        const itemPrefixExec = `${MagicNumbers.COLORIZE_LINE_PREFIX}${MagicNumbers.EXEC_COLOR}-rwxr-xr-x`;
        const itemPrefixDir = `${MagicNumbers.COLORIZE_LINE_PREFIX}${MagicNumbers.DIRECTORY_LIST_COLOR}drwxr-xr-x`;

        const prefix = appConfigObject.isExec ? itemPrefixExec :
            appConfigObject.isDir ? itemPrefixDir :
            itemPrefix;

        const suffix = appConfigObject.isDir ? '/' :
            appConfigObject.isExec ? '' : '';

        const displaySize = this._hasArg('h') ?
            this._formatSize(appConfigObject.size) :
            appConfigObject.size.toString();

        // formate date for display
        const dateString = appConfigObject.date.toString();
        const dateArray = dateString.split(' ');
        const month = dateArray[1];
        const day = dateArray[2];
        const timeFull = dateArray[4].substring(0, 5);
        const displayDate = `${month} ${day} ${timeFull}`;

        return prefix.
            concat(this._getOwner(appConfigObject, longstName)).
            concat(`${displaySize.padStart(longestSize, ' ')} `).
            concat(`${displayDate} `).
            concat(appConfigObject.commandName.concat(suffix));

    },

    _formatSize(size) {
        const sizeWithCommas = size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const sizeAsArray = sizeWithCommas.split(',');
        let response = '';

        switch(sizeAsArray.length) {
            case 1:
                response = `${sizeWithCommas}b`;
                break;
            case 2:
                response = `${sizeAsArray[0]}K`;
                break;
            case 3:
                response = `${sizeAsArray[0]}M`;
                break;
            case 4:
                response = `${sizeAsArray[0]}T`;
                break;
            default:
                response = sizeWithCommas;
        }

        return response;
    },

    _commandNameFormatter(currItem) {
        return currItem.commandName.length;
    },

    _sizeFormatter(currItem, scope) {
        return scope._hasArg('h') ?
            scope._formatSize(currItem.size).length :
            currItem.size.toString().length;
    },

    _nameFormatter(currItem, scope) {
        const owner = currItem.owner || { uname: scope.persistenceHandler.getUsername(), uid: '1000' };
        return owner.uname.length;
    },

    _getLongestValue(commandList, formatter) {
        let longest = 0;
        const scope = this;
        commandList.forEach((currItem) => {
            const currSizeLength = formatter(currItem, scope);
            if (currSizeLength > longest) {
                longest = currSizeLength;
            }
        });

        return longest;
    },

    _responseTall(commandList) {
        const scope = this;
        const longestSize = this._getLongestValue(commandList, this._sizeFormatter);
        const longstName = this._getLongestValue(commandList, this._nameFormatter)

        return commandList.map((currCommandItem) => {
            return scope._createDetailedLine(
                currCommandItem,
                longestSize,
                longstName);
        });
    },

    _responseWide(commandList) {
        const distanceBetweenItems = 2;
        const longestCommandNameLength = this._getLongestValue(
                commandList,
                this._commandNameFormatter
            ) + distanceBetweenItems;

        let response = '';
        commandList.forEach((currResponseItem) => {
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
