import { Store as VStore } from "vuex";

import { actions } from "./actions";
import { getters } from "./getters";
import { modules } from "./modules";
import { mutations } from "./mutations";
import { State, state } from "./state";
import { Store, store } from "./store";

import { Options } from "./options";

export {
  actions,
  getters,
  modules,
  mutations,
  store,
  state,
  Store,
  State,
  Options as StoreOptions,
};

export const commits = mutations;

/**
 * Alias for `actions`.
 */
export const dispatches = actions;

/**
 * Converts a `Vuex.Store` into the internal `Store` format.
 *
 * This is a convenience function that converts the `Vuex.Store<S>` into a
 * `Store<O>`, so long as the `S` is equal to `O`'s `state` property.
 *
 * @param $store The Vuex.Store object to convert.
 */
export const into = <O extends Options<any>>(
  $store: VStore<State<O>>
): Store<O> => $store;

/**
 * Creates the full set of accessors from a store.
 *
 * @param $store The store to create accessors from.
 */
export const makeAccessors = <O extends Options<any>>($store: Store<O>) => {
  const commit = commits($store);
  const dispatch = actions($store);
  return {
    state: state($store),
    commit,
    dispatch,
    mutations: commit,
    actions: dispatch,
    getters: getters($store),
    modules: modules($store),
  };
};

export default {
  into,
  store,
  state,
  commits,
  dispatches,
  getters,
  modules,
  actions,
  mutations,
  makeAccessors,
};
