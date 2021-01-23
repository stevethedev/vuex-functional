import { DispatchOptions } from "vuex";
import { Payload } from "./mutations";
import { Options } from "./options";
import { proxyFactory } from "./proxies";
import { Store } from "./store";

/**
 * Provides easy access to the actions on the store.
 *
 * @param s The store to load actions from.
 */
export const actions = <O extends Options<any>>(s: Store<O>): Actions<O> => {
  return new Proxy({}, proxyFactory(s, "dispatch"));
};

/**
 * Extract the list of actions.
 */
export type Actions<O extends Options<any>> = O extends { actions: infer A }
  ? { [K in keyof A]: Action<A[K]> }
  : never;


/**
 * Extracts a single committer.
 */
export type Action<A> = A extends (...args: any[]) => infer R
  ? (Payload<A> extends Exclude<Payload<A>, undefined>
    ? (payload: Payload<A>, options?: DispatchOptions) => R
    : (payload?: Payload<A>, options?: DispatchOptions) => R)
  : never;
