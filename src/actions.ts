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
export type Actions<O extends Options<any>> = {
  [K in keyof O["actions"]]: O["actions"][K] extends (
    ...args: any
  ) => Promise<any>
    ? Action<O["actions"][K]>
    : never;
};

/**
 * Extracts a single committer.
 */
export type Action<A extends (...args: any) => Promise<any>> = Payload<
  A
> extends undefined
  ? (payload?: Payload<A>, options?: DispatchOptions) => Promise<ReturnType<A>>
  : (payload: Payload<A>, options?: DispatchOptions) => Promise<ReturnType<A>>;
