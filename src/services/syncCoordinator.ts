let cloudSyncGeneration = 0;
const activeCloudSyncs = new Set<Promise<void>>();

export const getCloudSyncGeneration = (): number => cloudSyncGeneration;

export const trackCloudSync = (promise: Promise<void>): void => {
  activeCloudSyncs.add(promise);
  void promise.then(
    () => activeCloudSyncs.delete(promise),
    () => activeCloudSyncs.delete(promise)
  );
};

export const invalidateCloudSyncs = async (): Promise<void> => {
  cloudSyncGeneration += 1;
  await Promise.allSettled([...activeCloudSyncs]);
};
