import { Options } from "./options";
import { Store } from "./store";

/**
 * Retrieves the state from a store.
 * @param store The store to get content from.
 */
export const state = <O extends Options<any>>(store: Store<O>): State<O> => {
  return store.state as State<O>;
};

/**
 * Extract the state object from a literal or function, or else `never`.
 */
export type State<O extends Options<any>> = O["state"] extends () => infer R
  ? R
  : O["state"];
