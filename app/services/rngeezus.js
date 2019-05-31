import Service from '@ember/service';
import { set } from '@ember/object';

export default Service.extend({
    init() {
        this._super(...arguments);

        const initPool = [];
        const maxDisplacement = 20;
        for(let i = 0; i < 20000; i++) {
            const newValue = Math.ceil(Math.random() * maxDisplacement) - (maxDisplacement / 2);
            initPool.push(newValue);
        }

        set(this, 'rngPool', initPool);
        set(this, 'rngIndex', 0);
    },

    // Currently the values in initPool are specific to the displacement deformation in iza-computer
    // if you use it anywhere else you'll need to make some updates
    getRandomValue() {
        const currIndex = this.rngIndex;
        const retVal = this.rngPool[currIndex];

        let nextIndex = currIndex + 1;
        if (nextIndex > this.rngPool.length - 1) {
            nextIndex = 0;
        }
        set(this, 'rngIndex', nextIndex);

        return retVal;
    }
});