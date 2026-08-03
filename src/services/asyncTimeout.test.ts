import { describe, expect, it, vi } from 'vitest';
import { withAbortableTimeout } from './asyncTimeout';

describe('withAbortableTimeout', () => {
  it('aborts the underlying operation when it times out', async () => {
    vi.useFakeTimers();
    let receivedSignal: AbortSignal | undefined;
    const operation = withAbortableTimeout(
      (signal) => {
        receivedSignal = signal;
        return new Promise(() => {});
      },
      1000,
      'Operation timed out'
    );
    const rejection = expect(operation).rejects.toThrow('Operation timed out');

    await vi.advanceTimersByTimeAsync(1000);

    await rejection;
    expect(receivedSignal?.aborted).toBe(true);
    vi.useRealTimers();
  });
});
