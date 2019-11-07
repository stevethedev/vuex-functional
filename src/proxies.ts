import { CommitOptions, DispatchOptions } from "vuex";
import { Options } from "./options";
import { Store } from "./store";

/**
 * Generates a proxy object for runing commits and dispatches.
 *
 * @param store The store to execute commits/dispatches against.
 * @param method The name of the function to execute on the store.
 */
export const proxyFactory = <
  O extends Options<any>,
  OPT extends DispatchOptions | CommitOptions
>(
  store: Store<O>,
  method: "commit" | "dispatch"
) => ({
  get: (_target, prop: string) => (payload?: any, options?: OPT) => {
    return store[method](prop, payload, options);
  }
});
