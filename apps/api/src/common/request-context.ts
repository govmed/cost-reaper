import { AsyncLocalStorage } from 'node:async_hooks';

/** Per-request context carried implicitly so deep services (e.g. the audit
 *  trail) can record the caller's IP and optional location without threading
 *  the request through every method call (FR-11, NFR-9). */
export interface RequestContext {
  ip?: string;
  /** Optional client-supplied coarse location (e.g. "lat,lng"), if the user
   *  has location services enabled and granted permission. */
  location?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}
