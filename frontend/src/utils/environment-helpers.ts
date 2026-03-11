import type { AppEnvironment } from '../types/terminal';

/** Partial options for constructing an AppEnvironment; all fields optional with sensible defaults */
export type EnvironmentOptions = Partial<AppEnvironment>;

const environmentHelpers = {
    generateEnvironmentWithDefaults(options: EnvironmentOptions): AppEnvironment {
        return {
            activeAppName: options.activeAppName ?? 'index',
            displayAppNameInPrompt: options.displayAppNameInPrompt,
            interruptPrompt: options.interruptPrompt,
            response: options.response ?? ['no application response provided'],
            keyOverrides: options.keyOverrides,
            overrideScope: options.overrideScope,
        };
    },

    getRandomResponseFromList(list: string[]): string {
        const randomResponseIndex = Math.floor(Math.random() * list.length);

        return list[randomResponseIndex];
    },

    handleTabComplete(fragment: string, itemSets: string[][]): string | null {
        // check for arguments
        const splitFrag = fragment.toLowerCase().split(' ');
        const itemFrag = splitFrag[splitFrag.length - 1];

        // get item names
        let listOfItemNames = itemSets[0];

        if (splitFrag.length > 1) {
            // get matched item
            listOfItemNames = itemSets[itemSets.length - 1];
            const matchedItem = this.getItemFromSetByFragment(itemFrag, listOfItemNames);

            if (matchedItem != null) {
                // recombine result
                const firstPortion = splitFrag.slice(0, -1);
                firstPortion.push(matchedItem);

                return firstPortion.join(' ');
            }
        }

        return this.getItemFromSetByFragment(itemFrag, listOfItemNames);
    },

    getItemFromSetByFragment(fragment: string, set: string[]): string | null {
        const testEntry = fragment.toUpperCase();

        const matches = set.filter((currCmdDef) => {
            const currCommandUpper = currCmdDef.toUpperCase();
            return currCommandUpper.indexOf(testEntry) === 0;
        });

        return matches.length === 1 ? matches[0] : null;
    },
};

export default environmentHelpers;
