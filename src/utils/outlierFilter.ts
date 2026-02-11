/**
 * Generic outlier filter using standard deviation.
 * Removes items where |value - mean| > threshold * stddev.
 * Returns the original array if < 3 items (not enough data for stats)
 * or if stdDev === 0 (all values are the same).
 */
export const filterOutliers = <T>(
  items: T[],
  getValue: (item: T) => number,
  stdDevThreshold: number = 2
): T[] => {
  if (items.length < 3) return items;

  const values = items.map(getValue);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return items;

  return items.filter((item) => {
    const value = getValue(item);
    return Math.abs(value - mean) <= stdDevThreshold * stdDev;
  });
};
