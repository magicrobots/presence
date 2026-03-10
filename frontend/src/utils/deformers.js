import rngeezus from './rngeezus';

export function applyAllDeformers(imageData) {
    if (!imageData) {
        return false;
    }

    const l = imageData.data.length / 4;
    const glowParams = { enabled: true, useRandom: true, maxContrast: 120, distance: 3, falloff: { near: 1.0, mid: 0.5, far: 0.2 } };
    const randomValue = rngeezus.getRandomValue('largeDisplacementPool');

    for (let i = 0; i < l; i++) {
        _pixelizeBit(i, imageData);
        _shiftPixel(i, imageData);
        _glowEdgesBit(i, imageData, glowParams, randomValue);
    }

    return imageData;
}

function _shiftPixel(i, imageData) {
    const positionFactor = 5;
    let r = imageData.data[i * 4 + 0];
    let g = imageData.data[i * 4 + 1];
    let b = imageData.data[i * 4 + 2];
    let r1 = imageData.data[i * positionFactor + 0];
    let g1 = imageData.data[i * positionFactor + 1];
    let b1 = imageData.data[i * positionFactor + 2];
    const factor = 7;
    if (r + b + g > 140) {
        imageData.data[i * positionFactor + 0] = r1 + r / factor;
        imageData.data[i * positionFactor + 1] = g1 + g / factor;
        imageData.data[i * positionFactor + 2] = b1 + b / factor;
    } else {
        imageData.data[i * positionFactor + 0] = r1 - r / factor;
        imageData.data[i * positionFactor + 1] = g1 - g / factor;
        imageData.data[i * positionFactor + 2] = b1 - b / factor;
    }
}

function _pixelizeBit(i, imageData) {
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
}

function _glowEdgesBit(i, imageData, params, randomValue) {
    if (!params.enabled) {
        return;
    }

    let r = imageData.data[i * 4 + 0];
    let g = imageData.data[i * 4 + 1];
    let b = imageData.data[i * 4 + 2];
    let r1 = imageData.data[(i + params.distance) * 4 + 0];
    let g1 = imageData.data[(i + params.distance) * 4 + 1];
    let b1 = imageData.data[(i + params.distance) * 4 + 2];

    const currBrightness = r + g + b;
    const nextBrightness = r1 + g1 + b1;
    const contrast = Math.abs(nextBrightness - currBrightness);

    if (contrast > params.maxContrast)
    {
        const baseIncreaseAmount = params.useRandom ? (20 + randomValue) : 20;

        const nextPixelIndex = i + 1;
        const nextPixelR = imageData.data[nextPixelIndex * 4 + 0];
        const nextPixelG = imageData.data[nextPixelIndex * 4 + 1];
        const nextPixelB = imageData.data[nextPixelIndex * 4 + 2];
        const nearAmount = baseIncreaseAmount * params.falloff.near;
        imageData.data[nextPixelIndex * 4 + 0] = nextPixelR + nearAmount;
        imageData.data[nextPixelIndex * 4 + 1] = nextPixelG + nearAmount;
        imageData.data[nextPixelIndex * 4 + 2] = nextPixelB + nearAmount;

        const middlePixelIndex = i + 2;
        const middlePixelR = imageData.data[middlePixelIndex * 4 + 0];
        const middlePixelG = imageData.data[middlePixelIndex * 4 + 1];
        const middlePixelB = imageData.data[middlePixelIndex * 4 + 2];
        const midAmount = baseIncreaseAmount * params.falloff.mid;
        imageData.data[middlePixelIndex * 4 + 0] = middlePixelR + midAmount;
        imageData.data[middlePixelIndex * 4 + 1] = middlePixelG + midAmount;
        imageData.data[middlePixelIndex * 4 + 2] = middlePixelB + midAmount;

        const farPixelIndex = i + 3;
        const farPixelR = imageData.data[farPixelIndex * 4 + 0];
        const farPixelG = imageData.data[farPixelIndex * 4 + 1];
        const farPixelB = imageData.data[farPixelIndex * 4 + 2];
        const farAmount = baseIncreaseAmount * params.falloff.far;
        imageData.data[farPixelIndex * 4 + 0] = farPixelR + farAmount;
        imageData.data[farPixelIndex * 4 + 1] = farPixelG + farAmount;
        imageData.data[farPixelIndex * 4 + 2] = farPixelB + farAmount;
    }
}
