import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import commandRegistry from '../constants/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import MagicNumbers from '../constants/magic-numbers';
import persistence from '../utils/persistence';
import type { InputProcessor } from '../types/terminal';

// --------------------------------------------------------------------------
// Pure helpers — all take lsArgs explicitly to avoid module-level state
// --------------------------------------------------------------------------

function hasArg(lsArgs: string | null, pChar: string): true | null {
    return !lsArgs || lsArgs.indexOf(pChar) === -1 ? null : true;
}

function getPrunedCommandList(addHiddenItems: true | null) {
    return commandRegistry.registry
        .filter(r => addHiddenItems ? !r.isInvisible : (!r.isHidden && !r.isInvisible))
        .slice()
        .sort((a, b) => a.commandName.localeCompare(b.commandName));
}

function formatSize(size: number): string {
    const sizeWithCommas = size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const sizeAsArray = sizeWithCommas.split(',');
    switch (sizeAsArray.length) {
        case 1: return `${sizeWithCommas}b`;
        case 2: return `${sizeAsArray[0]}K`;
        case 3: return `${sizeAsArray[0]}M`;
        case 4: return `${sizeAsArray[0]}T`;
        default: return sizeWithCommas;
    }
}

function getLongestValue(commandList: ReturnType<typeof getPrunedCommandList>, formatter: (item: ReturnType<typeof getPrunedCommandList>[number]) => number): number {
    let longest = 0;
    commandList.forEach((currItem) => {
        const len = formatter(currItem);
        if (len > longest) { longest = len; }
    });
    return longest;
}

function getOwner(appConfigObject: ReturnType<typeof getPrunedCommandList>[number], longstName: number, lsArgs: string | null): string {
    const hardlinks = Math.ceil(Math.random() * 5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy JS property, not in typed registry
    const owner = (appConfigObject as any).owner || { uname: persistence.getUsername(), uid: '1000' };
    return ` ${hardlinks} ${hasArg(lsArgs, 'n') ? owner.uid.padStart(4) : owner.uname.padStart(longstName)} `;
}

function createDetailedLine(appConfigObject: ReturnType<typeof getPrunedCommandList>[number], longestSize: number, longstName: number, lsArgs: string | null): string {
    const itemPrefix = '-rw-r--r--';
    const itemPrefixExec = `${MagicNumbers.COLORIZE_LINE_PREFIX}${MagicNumbers.EXEC_COLOR}-rwxr-xr-x`;
    const itemPrefixDir = `${MagicNumbers.COLORIZE_LINE_PREFIX}${MagicNumbers.DIRECTORY_LIST_COLOR}drwxr-xr-x`;

    const prefix = appConfigObject.isExec ? itemPrefixExec :
        appConfigObject.isDir ? itemPrefixDir :
        itemPrefix;

    const suffix = appConfigObject.isDir ? '/' : '';

    const displaySize = hasArg(lsArgs, 'h')
        ? formatSize(appConfigObject.size ?? 0)
        : (appConfigObject.size ?? 0).toString();

    const dateString = (appConfigObject.date ?? new Date()).toString();
    const dateArray = dateString.split(' ');
    const month = dateArray[1];
    const day = dateArray[2];
    const timeFull = dateArray[4].substring(0, 5);
    const displayDate = `${month} ${day} ${timeFull}`;

    return prefix
        .concat(getOwner(appConfigObject, longstName, lsArgs))
        .concat(`${displaySize.padStart(longestSize, ' ')} `)
        .concat(`${displayDate} `)
        .concat(appConfigObject.commandName.concat(suffix));
}

function responseTall(commandList: ReturnType<typeof getPrunedCommandList>, lsArgs: string | null): string[] {
    const sizeFormatter = (item: ReturnType<typeof getPrunedCommandList>[number]) => hasArg(lsArgs, 'h')
        ? formatSize(item.size ?? 0).length
        : (item.size ?? 0).toString().length;

    const nameFormatter = (item: ReturnType<typeof getPrunedCommandList>[number]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy JS property
        const owner = (item as any).owner || { uname: persistence.getUsername(), uid: '1000' };
        return owner.uname.length;
    };

    const longestSize = getLongestValue(commandList, sizeFormatter);
    const longstName = getLongestValue(commandList, nameFormatter);

    return commandList.map(item => createDetailedLine(item, longestSize, longstName, lsArgs));
}

function responseWide(commandList: ReturnType<typeof getPrunedCommandList>): string[] {
    const distanceBetweenItems = 2;
    const longestLen = getLongestValue(commandList, (item) => item.commandName.length) + distanceBetweenItems;
    let response = '';
    commandList.forEach((item) => {
        response = response.concat(item.commandName.padEnd(longestLen, ' '));
    });
    return [response];
}

function handleNonModifierArgument(lsArgs: string): string[] {
    if (commandRegistry.getIsDirectory(lsArgs) || lsArgs.indexOf('/') > -1) {
        return [`ls: ACCESS DENIED (${lsArgs})`];
    } else if (commandRegistry.getMatchingCommand(lsArgs) != null &&
               !commandRegistry.getIsInvisible(lsArgs)) {
        return [lsArgs];
    }
    return [`ls: cannot access '${lsArgs}': No such file or directory`];
}

function buildLsResponse(_rawUserEntry: string, lsArgs: string | null): string[] {
    const addHiddenItems = hasArg(lsArgs, 'a');
    let commandList = getPrunedCommandList(addHiddenItems);

    // apply sort flags (each creates a new sorted array to avoid mutation)
    if (hasArg(lsArgs, 'S')) {
        commandList = commandList.slice().sort((a, b) => (a.size ?? 0) - (b.size ?? 0)).reverse();
    }
    if (hasArg(lsArgs, 't')) {
        commandList = commandList.slice().sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime()).reverse();
    }
    if (hasArg(lsArgs, 'r')) {
        commandList = commandList.slice().reverse();
    }

    // plain entry — no arguments
    if (lsArgs == null) {
        return responseWide(commandList);

    // process flag arguments (must contain a dash)
    } else if (hasArg(lsArgs, '-')) {
        return hasArg(lsArgs, 'l') || hasArg(lsArgs, 'n')
            ? responseTall(commandList, lsArgs)
            : responseWide(commandList);

    // process non-flag argument (e.g. a filename)
    } else {
        return handleNonModifierArgument(lsArgs);
    }
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function CmdLs() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        const rawUserEntry = inputProcessor.state.rawUserEntry;
        let lsArgs: string | null = rawUserEntry.split(' ')[1] || null;

        // ls ./ is same as ls with no args
        if (lsArgs === './' || lsArgs === '.') {
            lsArgs = rawUserEntry.split(' ')[2] || null;
        }

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-ls',
            response: buildLsResponse(rawUserEntry, lsArgs)
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
