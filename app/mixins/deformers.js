import Mixin from '@ember/object/mixin';
import { set } from '@ember/object';

export default Mixin.create({

    BIT_INCREMENT: 47,

    initialBit: 0,
    currentChunk: 0,
    chunkSize: 5000000,
    noiseSectionIndex: 0,

    noise(imageData, chunkIncrementer = 0) {
        if (!imageData) {
            return false;
        }

        for(let i = (this.chunkSize * this.currentChunk + chunkIncrementer) + this.initialBit;
            i < this.chunkSize * (this.currentChunk + 1 + chunkIncrementer);
            i += this.BIT_INCREMENT) {
            const originalValue = imageData.data[i];
            const maxAdjustment = 50;
            // const randomAdjustment = this.bunchaRandoms[i] * maxAdjustment;
            const randomAdjustment = Math.random() * maxAdjustment;
            imageData.data[i] = originalValue + randomAdjustment;// - (maxAdjustment / 2);
        }

        // cycle initial bit
        let nextInitialBit = this.initialBit + 1;
        if (nextInitialBit >= this.BIT_INCREMENT) {
            nextInitialBit = 0;
        }
        set(this, 'initialBit', nextInitialBit);

        // cycle chunk
        let nextChunk = this.currentChunk + 1;
        const maxChunk = imageData.data.length / this.chunkSize;
        if (nextChunk >= maxChunk) {
            nextChunk = 0;
        }
        set(this, 'currentChunk', nextChunk);

        return imageData;
    },

    pixelize(imageData) {
        if (!imageData) {
            return false;
        }
        
        const l = imageData.data.length / 4;

        for (let i = 0; i < l; i++) {
            let r = imageData.data[i * 4 + 0];
            let g = imageData.data[i * 4 + 1];
            let b = imageData.data[i * 4 + 2];
            
            if (i % 4 === 1)
            {
                // red pixel
                imageData.data[i * 4 + 0] = r + 12;
                imageData.data[i * 4 + 1] = g - 12;
                imageData.data[i * 4 + 2] = b - 12;
            }
            
            if (i % 4 === 2)
            {
                // blue pixel
                imageData.data[i * 4 + 0] = r - 12;
                imageData.data[i * 4 + 1] = g - 12;
                imageData.data[i * 4 + 2] = b + 12;
            }
            
            if (i % 4 === 3)
            {
                // brighten pixel
                imageData.data[i * 4 + 0] = r + 6;
                imageData.data[i * 4 + 1] = g + 6;
                imageData.data[i * 4 + 2] = b + 6;
            }
        }

        return imageData;
    },

    glowEdges(imageData) {
        if (!imageData) {
            return false;
        }
        
        let l = imageData.data.length / 4;

        for (let i = 0; i < l; i++) {
            let r = imageData.data[i * 4 + 0];
            let g = imageData.data[i * 4 + 1];
            let b = imageData.data[i * 4 + 2];
            let r1 = imageData.data[(i + 1) * 4 + 0];
            let g1 = imageData.data[(i + 1) * 4 + 1];
            let b1 = imageData.data[(i + 1) * 4 + 2];

            const currBrightness = r + g + b;
            const nextBrightness = r1 + g1 + b1;
            const contrast = Math.abs(nextBrightness - currBrightness);
            const maxContrast = 100;

            if (contrast > maxContrast)
            {
                const increaseAmount = 20 + Math.random() * 10;
                const nextPixelIndex = i + 1;
                const nextPixelR = imageData.data[nextPixelIndex * 4 + 0];
                const nextPixelG = imageData.data[nextPixelIndex * 4 + 1];
                const nextPixelB = imageData.data[nextPixelIndex * 4 + 2];
                imageData.data[nextPixelIndex * 4 + 0] = nextPixelR + increaseAmount;
                imageData.data[nextPixelIndex * 4 + 1] = nextPixelG + increaseAmount;
                imageData.data[nextPixelIndex * 4 + 2] = nextPixelB + increaseAmount;

                const middleIncreaseAmount = increaseAmount * 0.5;
                const middlePixelIndex = i + 2;
                const middlePixelR = imageData.data[middlePixelIndex * 4 + 0];
                const middlePixelG = imageData.data[middlePixelIndex * 4 + 1];
                const middlePixelB = imageData.data[middlePixelIndex * 4 + 2];
                imageData.data[middlePixelIndex * 4 + 0] = middlePixelR + middleIncreaseAmount;
                imageData.data[middlePixelIndex * 4 + 1] = middlePixelG + middleIncreaseAmount;
                imageData.data[middlePixelIndex * 4 + 2] = middlePixelB + middleIncreaseAmount;

                const farIncreaseAmount = increaseAmount * 0.2;
                const farPixelIndex = i + 3;
                const farPixelR = imageData.data[farPixelIndex * 4 + 0];
                const farPixelG = imageData.data[farPixelIndex * 4 + 1];
                const farPixelB = imageData.data[farPixelIndex * 4 + 2];
                imageData.data[farPixelIndex * 4 + 0] = farPixelR + farIncreaseAmount;
                imageData.data[farPixelIndex * 4 + 1] = farPixelG + farIncreaseAmount;
                imageData.data[farPixelIndex * 4 + 2] = farPixelB + farIncreaseAmount;
            }
        }

        return imageData;
    }
});