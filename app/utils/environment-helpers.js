import { isPresent } from '@ember/utils';

export default {

    generateEnvironmentWithDefaults: function(options) {
        return {
            activeAppName: options.activeAppName || 'index',
            displayAppNameInPrompt: options.displayAppNameInPrompt,
            interruptPrompt: options.interruptPrompt,
            response: options.response || ['no application response provided'],
            keyOverrides: options.keyOverrides,
            overrideScope: options.overrideScope
        }
    },

    getRandomResponseFromList(list) {
        const randomResponseIndex = Math.floor(Math.random() * list.length);

        return list[randomResponseIndex];
    },

    handleTabComplete(fragment, itemSets) {
        // check for arguments
        const splitFrag = fragment.toLowerCase().split(' ');
        const itemFrag = splitFrag[splitFrag.length - 1];

        // get item names
        let listOfItemNames = itemSets[0];

        if (splitFrag.length > 1) {
            // get matched item
            listOfItemNames = itemSets[itemSets.length -1];
            const matchedItem = this.getItemFromSetByFragment(itemFrag, listOfItemNames);

            if (isPresent(matchedItem)) {
                // recombine result
                const firstPortion = splitFrag.slice(0, -1);
                firstPortion.push(matchedItem);
                
                return firstPortion.join(' ');
            }
        }

        return this.getItemFromSetByFragment(itemFrag, listOfItemNames);
    },

    getItemFromSetByFragment(fragment, set) {
        const testEntry = fragment.toUpperCase();

        const matches = set.filter((currCmdDef) => {
            const currCommandUpper = currCmdDef.toUpperCase();
            if(currCommandUpper.indexOf(testEntry) === 0) {
                return true;
            }
        });

        return matches.length === 1 ? matches[0] : null;
    }
}
