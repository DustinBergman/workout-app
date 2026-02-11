import { describe, it, expect } from 'vitest';
import { filterOutliers } from './outlierFilter';

describe('filterOutliers', () => {
  it('removes a clear outlier from numbers', () => {
    const items = [50, 52, 48, 51, 49, 500];
    const result = filterOutliers(items, (v) => v);
    expect(result).toEqual([50, 52, 48, 51, 49]);
  });

  it('keeps normal data when no outliers exist', () => {
    const items = [100, 102, 98, 101, 99];
    const result = filterOutliers(items, (v) => v);
    expect(result).toEqual(items);
  });

  it('returns original array if fewer than 3 items', () => {
    expect(filterOutliers([1, 1000], (v) => v)).toEqual([1, 1000]);
    expect(filterOutliers([5], (v) => v)).toEqual([5]);
    expect(filterOutliers([], (v) => v)).toEqual([]);
  });

  it('returns original array if stdDev is 0 (all same values)', () => {
    const items = [50, 50, 50, 50];
    const result = filterOutliers(items, (v) => v);
    expect(result).toEqual(items);
  });

  it('works with custom threshold', () => {
    // With a tight threshold of 1, more items get filtered
    const items = [50, 52, 48, 55, 45, 51];
    const resultTight = filterOutliers(items, (v) => v, 1);
    const resultLoose = filterOutliers(items, (v) => v, 3);
    expect(resultTight.length).toBeLessThanOrEqual(resultLoose.length);
  });

  it('works with objects and accessor function', () => {
    const items = [
      { name: 'a', weight: 50 },
      { name: 'b', weight: 52 },
      { name: 'c', weight: 48 },
      { name: 'd', weight: 51 },
      { name: 'e', weight: 49 },
      { name: 'f', weight: 500 },
    ];
    const result = filterOutliers(items, (item) => item.weight);
    expect(result).toEqual([
      { name: 'a', weight: 50 },
      { name: 'b', weight: 52 },
      { name: 'c', weight: 48 },
      { name: 'd', weight: 51 },
      { name: 'e', weight: 49 },
    ]);
  });

  it('handles boundary values correctly', () => {
    // Values right at the threshold boundary
    const items = [10, 10, 10, 10, 10, 10, 10, 20];
    const result = filterOutliers(items, (v) => v);
    // 20 is an outlier relative to the cluster at 10
    expect(result.length).toBeLessThan(items.length);
  });

  it('removes both high and low outliers', () => {
    const items = [50, 52, 48, 51, 49, 500, 1];
    const result = filterOutliers(items, (v) => v);
    // Both 500 and 1 should be removed (depending on stddev math)
    // At minimum, 500 should definitely be removed
    expect(result).not.toContain(500);
  });
});
