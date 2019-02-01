import Mixin from '@ember/object/mixin';
import { isPresent } from '@ember/utils';
import { set } from '@ember/object';

export default Mixin.create({

    BIT_INCREMENT: 13,

    initialBit: 0,
    currentChunk: 0,
    chunkSize: 1000000,

    noise(pChunk) {
        if (!this.originalScreenBitmap) {
            return false;
        }

        if (isPresent(pChunk)) {
            set(this, 'currentChunk', pChunk);
        }

        for(let i = (this.chunkSize * this.currentChunk) + this.initialBit;
            i < this.chunkSize * (this.currentChunk + 1);
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

        // cycle chunk
        let nextChunk = this.currentChunk + 1;
        const maxChunk = this.originalScreenBitmap.data.length / this.chunkSize;
        if (nextChunk >= maxChunk) {
            nextChunk = 0;
        }
        set(this, 'currentChunk', nextChunk);

        return this.originalScreenBitmap.data;
    }
});