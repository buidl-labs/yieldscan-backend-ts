import { scaleData, normalizeData, chunkArray } from '../src/services/utils';

describe('Scaling between 100 and 1 Test', () => {
  it('Min: 1, Max: 5000 value: 100', () => {
    expect(scaleData(100, 5000, 1)).toBe(2.9605921184236847);
  });
});

describe('Scaling between 100 and 1 Test', () => {
  it('Min: 0, Max: 1 value: 0.2', () => {
    expect(scaleData(0.2, 1, 0)).toBe(20.8);
  });
});

describe('Normalize data', () => {
  it('Min: 1, Max: 5000 value: 100', () => {
    expect(normalizeData(100, 5000, 1)).toBe(0.01980396079215843);
  });
});

describe('Normalize data', () => {
  it('Min: 0, Max: 1 value: 0.2', () => {
    expect(normalizeData(0.2, 1, 0)).toBe(0.2);
  });
});

describe('Chunk array', () => {
  it('[ a, b, c, d, e ]', () => {
    expect(JSON.stringify(chunkArray(['a', 'b', 'c', 'd', 'e'], 3))).toBe('[["a","b","c"],["d","e"]]');
  });
});

describe('Chunk array', () => {
  it('[ a, b, c, d, e ]', () => {
    expect(JSON.stringify(chunkArray(['a', 'b', 'c', 'd', 'e'], 5))).toBe('[["a","b","c","d","e"]]');
  });
});
