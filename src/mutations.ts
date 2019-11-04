import { CommitOptions, DispatchOptions } from "vuex";
import { Options } from "./options";
import { Store } from "./store";

/**
 * Provides easy access to the mutations on the store.
 *
 * @param s The store to load commits from.
 */
export const mutations = <O extends Options<any>>(s: Store<O>): Commits<O> => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => (payload?: any, options?: DispatchOptions) =>
        s.commit(prop as string, payload, options)
    }
  ) as any;
};

/**
 * Extract the list of commits, or else `never`.
 */
export type Commits<O extends Options<any>> = O extends { mutations: infer M }
  ? {
      [K in keyof M]: Commit<M[K]>;
    }
  : never;

/**
 * Extracts a single committer.
 */
export type Commit<M> = Payload<M> extends undefined
  ? (payload?: Payload<M>, options?: CommitOptions) => void
  : (payload: Payload<M>, options?: CommitOptions) => void;

/**
 * Extracts the payload type from a callback function.
 */
export type Payload<F> = F extends (...args: infer T) => unknown ? T[1] : never;
