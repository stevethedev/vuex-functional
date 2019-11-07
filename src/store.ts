import { SetupContext } from "@vue/composition-api";
import { CombinedVueInstance, Vue } from "vue/types/vue";
import { Store as VStore } from "vuex";

import { Getters } from "./getters";
import { Options } from "./options";

/**
 * Pulls the store from the Vue Composition API's SetupContext object.
 *
 * @param ctx The context object to pull the store from.
 *
 * @throws if no store could be extracted.
 */
export const store = <O extends Options<any>>(
  ctx: SetupContext | VueComponent
): Store<O> => {
  const $store = isComponent(ctx)
    ? extractStore<O>(ctx)
    : extractStore<O>(ctx.root) || extractStore<O>(ctx.parent);

  if ($store) {
    return $store;
  }

  throw new Error("Could not retrieve Vuex Store from context object.");
};

const isComponent = (x: any): x is VueComponent => Boolean(x.$store);

/**
 * Extract the store from the target entity.
 *
 * @param target The target to pull the store from.
 */
const extractStore = <O extends Options<any>>(
  target: VueComponent | null
): Store<O> | null => {
  if (target) {
    if (target.$store) {
      return target.$store;
    }

    if (target.$children) {
      return extractStore(target.$children[0]);
    }
  }

  return null;
};

/**
 * Extends the Vuex.Store type to ensure compatibility with Vuex-proper.
 */
export interface Store<O extends Options<any>> extends VStore<O["state"]> {
  readonly getters: Getters<O>;
}

type VueComponent = CombinedVueInstance<
  Vue,
  object,
  object,
  object,
  Record<never, any>
>;
