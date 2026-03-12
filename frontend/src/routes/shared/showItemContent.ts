import commandRegistry from '../../constants/command-registry';

/** Returns display lines for a file-system item lookup (used by both cat and less) */
export function showItemContent(args: string[] | null): string[] {
    const itemArg = args != null && args.length > 0 ? args[0] : null;

    if (itemArg == null) {
        return ['Missing filename'];
    }

    const matchedItem = commandRegistry.registry.find(r => r.commandName === itemArg);

    if (matchedItem == null) {
        return [`${itemArg}: No such file or directory`];
    }

    if (matchedItem.isDir) {
        return [`${itemArg} is a directory`];
    }

    if (matchedItem.isExec) {
        return [`${itemArg} is an executable`];
    }

    return matchedItem.content ?? [`${itemArg}: No such file or directory`];
}
