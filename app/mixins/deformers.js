import Mixin from '@ember/object/mixin';
import { set } from '@ember/object';

export default Mixin.create({

    BIT_INCREMENT: 13,

    initialBit: 0,

    noise() {
        if (!this.originalScreenBitmap) {
            return false;
        }

        for(let i = this.initialBit;
            i < this.originalScreenBitmap.data.length;
            i += this.BIT_INCREMENT) {
            const originalValue = this.originalScreenBitmap.data[i];
            const maxAdjustment = 140;
            const randomAdjustment = Math.random() * maxAdjustment;
            this.originalScreenBitmap.data[i] = originalValue + randomAdjustment - (maxAdjustment / 2);
        }

        // cycle initial bit
        let nextInitialBit = this.initialBit + 1;
        if (nextInitialBit >= this.BIT_INCREMENT) {
            nextInitialBit = 0;
        }
        set(this, 'initialBit', nextInitialBit);

        return this.originalScreenBitmap.data;
    }
});