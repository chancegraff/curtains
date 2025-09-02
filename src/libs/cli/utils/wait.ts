import { subscribe } from '../../registry/registry';
import { Registry } from '../../schemas/store';

/**
 * Wait for pipeline completion or failure
 */
export function waitForPipeline(registry: Registry): Promise<void> {
  return new Promise((resolve, reject) => {
    // Subscribe to completion event
    const unsubComplete = subscribe(registry, 'coordinator-complete', () => {
      // Clean up both subscriptions
      unsubComplete();
      unsubFailed();
      resolve();
    });

    // Subscribe to failure event
    const unsubFailed = subscribe(registry, 'coordinator-failed', (event) => {
      // Clean up both subscriptions
      unsubComplete();
      unsubFailed();

      // Extract error message from event
      const errorMessage = event && typeof event === 'object' && 'error' in event
        ? String(event.error)
        : 'Pipeline execution failed';

      reject(new Error(errorMessage));
    });
  });
}

/**
 * Wait for specific event with timeout
 */
export function waitForEvent(
  registry: Registry,
  eventType: 'start-pipeline' | 'operation-complete' | 'state-changed' | 'error-occurred' | 'cache-invalidated' | 'stage-complete' | 'coordinator-complete' | 'coordinator-failed' | 'pipeline-started' | 'pipeline-progress' | 'pipeline-complete' | 'pipeline-failed' | 'stage-started' | 'stage-retry',
  timeoutMs: number = 30000
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Timeout waiting for event: ${eventType}`));
    }, timeoutMs);

    // Subscribe to event
    const unsubscribe = subscribe(registry, eventType, (payload) => {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(payload);
    });
  });
}
