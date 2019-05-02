import Mixin from '@ember/object/mixin';
import { set } from '@ember/object';

export default Mixin.create({

    everything(imageData) {
        if (!imageData) {
            return false;
        }
        
        const l = imageData.data.length / 4;

        for (let i = 0; i < l; i++) {
            this._shiftPixel(i, imageData);
            this._pixelizeBit(i, imageData);
            this._glowEdgesBit(i, imageData);
        }

        return imageData;
    },

    _shiftPixel(i, imageData) {
        let r = imageData.data[i * 4 + 0];
        let g = imageData.data[i * 4 + 1];
        let b = imageData.data[i * 4 + 2];
        let r1 = imageData.data[i * 5 + 0];
        let g1 = imageData.data[i * 5 + 1];
        let b1 = imageData.data[i * 5 + 2];
        const factor = 6;
        if (r + b + g > 140) {
            imageData.data[i * 5 + 0] = r1 + r / factor;
            imageData.data[i * 5 + 1] = g1 + g / factor;
            imageData.data[i * 5 + 2] = b1 + b / factor;
        } else {
            imageData.data[i * 5 + 0] = r1 - r / factor;
            imageData.data[i * 5 + 1] = g1 - g / factor;
            imageData.data[i * 5 + 2] = b1 - b / factor;
        }

    },

    _pixelizeBit(i, imageData) {
        let r = imageData.data[i * 4 + 0];
        let g = imageData.data[i * 4 + 1];
        let b = imageData.data[i * 4 + 2];

        const adjustmentSmall = 12;
        const adjustmentLarge = 24;
            
        if (i % 4 === 1)
        {
            // red pixel
            imageData.data[i * 4 + 0] = r + adjustmentLarge;
            imageData.data[i * 4 + 1] = g - adjustmentLarge;
            imageData.data[i * 4 + 2] = b - adjustmentLarge;
        }
        
        if (i % 4 === 2)
        {
            // blue pixel
            imageData.data[i * 4 + 0] = r - adjustmentLarge;
            imageData.data[i * 4 + 1] = g - adjustmentLarge;
            imageData.data[i * 4 + 2] = b + adjustmentLarge;
        }
        
        if (i % 4 === 3)
        {
            // brighten pixel
            imageData.data[i * 4 + 0] = r + adjustmentSmall;
            imageData.data[i * 4 + 1] = g + adjustmentSmall;
            imageData.data[i * 4 + 2] = b + adjustmentSmall;
        }

    },

    _glowEdgesBit(i, imageData) {
        const distance = Math.round(Math.random()) + 1;

        let r = imageData.data[i * 4 + 0];
        let g = imageData.data[i * 4 + 1];
        let b = imageData.data[i * 4 + 2];
        let r1 = imageData.data[(i + distance) * 4 + 0];
        let g1 = imageData.data[(i + distance) * 4 + 1];
        let b1 = imageData.data[(i + distance) * 4 + 2];

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
    },
});