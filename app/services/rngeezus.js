import Service from '@ember/service';
import { set } from '@ember/object';

export default Service.extend({
    init() {
        this._super(...arguments);

        // large value pool
        const largeDisplacementPool = [];
        const maxDisplacement = 20;
        for(let i = 0; i < 20000; i++) {
            const newValue = Math.ceil(Math.random() * maxDisplacement) - (maxDisplacement / 2);
            largeDisplacementPool.push(newValue);
        }

        // normal pool
        const smallPool = [];
        for(let i = 0; i < 20000; i++) {
            smallPool.push(Math.random());
        }

        set(this, 'largeDisplacementPool', largeDisplacementPool);
        set(this, 'smallPool', smallPool);
        set(this, 'rngIndex', 0);
    },

    // Currently the values in initPool are specific to the displacement deformation in iza-computer
    // if you use it anywhere else you'll need to make some updates
    getRandomValue(poolName) {
        const selectedPool = this[poolName];
        const currIndex = this.rngIndex;
        const retVal = selectedPool[currIndex];

        let nextIndex = currIndex + 1;
        if (nextIndex > selectedPool.length - 1) {
            nextIndex = 0;
        }
        set(this, 'rngIndex', nextIndex);

        return retVal;
    }
});