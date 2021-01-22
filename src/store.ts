import { Store as VStore, useStore } from "vuex";
import { InjectionKey } from "vue";

import { Getters } from "./getters";
import { Options } from "./options";

/**
 * Pulls the store from the Vue Composition API's SetupContext object.
 *
 * @param ctx The context object to pull the store from.
 *
 * @throws if no store could be extracted.
 */
export const store = <O extends Options<any>>(injectKey?: InjectionKey<Store<O>> | string): Store<O> => {
  const $store = useStore(injectKey);

  if ($store) {
    return $store;
  }

  throw new Error("Could not retrieve Vuex Store.");
};

/**
 * Extends the Vuex.Store type to ensure compatibility with Vuex-proper.
 */
export interface Store<O extends Options<any>> extends VStore<O["state"]> {
  readonly getters: Getters<O>;
}

