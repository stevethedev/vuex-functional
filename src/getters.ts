import { Options } from "./options";
import { Store } from "./store";

/**
 * Retrieves the getters from a store.
 * @param s The store to feed into the context.
 */
export const getters = <O extends Options<any>>(s: Store<O>): Getters<O> =>
  s.getters;

/**
 * Extract the getters, or else `never`.
 */
export type Getters<O extends Options<any>> = {
  [G in keyof O["getters"]]: Getter<O["getters"][G]>;
};

/**
 * Extracts a single getter.
 */
type Getter<G> = G extends (...args: any[]) => infer T ? T : never;
