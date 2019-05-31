import Service from '@ember/service';
import { set } from '@ember/object';

export default Service.extend({
    init() {
        this._super(...arguments);

        const initPool = [];
        for(let i = 0; i < 200; i++) {
            initPool.push(Math.round((Math.random() * 10)));
        }

        set(this, 'rngPool', initPool);
        set(this, 'rngIndex', 0);
    },

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