// large value pool
const largeDisplacementPool: number[] = [];
const maxDisplacement = 20;
for (let i = 0; i < 20000; i++) {
    const newValue = Math.ceil(Math.random() * maxDisplacement) - (maxDisplacement / 2);
    largeDisplacementPool.push(newValue);
}

// normal pool
const smallPool: number[] = [];
for (let i = 0; i < 20000; i++) {
    smallPool.push(Math.random());
}

let rngIndex = 0;

export type PoolName = 'largeDisplacementPool' | 'smallPool';

// Currently the values in initPool are specific to the displacement deformation in iza-computer
// if you use it anywhere else you'll need to make some updates
function getRandomValue(poolName: PoolName): number {
    const pools: Record<PoolName, number[]> = { largeDisplacementPool, smallPool };
    const selectedPool = pools[poolName];
    const currIndex = rngIndex;
    const retVal = selectedPool[currIndex];

    let nextIndex = currIndex + 1;
    if (nextIndex > selectedPool.length - 1) {
        nextIndex = 0;
    }
    rngIndex = nextIndex;

    return retVal;
}

export default { getRandomValue };
