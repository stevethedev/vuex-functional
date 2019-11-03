import { SetupContext } from "@vue/composition-api";
import { CombinedVueInstance, Vue } from "vue/types/vue";
import { CommitOptions, DispatchOptions, Store as VStore } from "vuex";

/**
 * Pulls the store from the Vue Composition API's SetupContext object.
 *
 * @param ctx The context object to pull the store from.
 *
 * @throws if no store could be extracted.
 */
export const store = <OPTIONS>(
  ctx: SetupContext | VueComponent
): Store<OPTIONS> => {
  const isComponent = (x: any): x is VueComponent => !!x.$store;

  const $store = isComponent(ctx)
    ? extractStore<OPTIONS>(ctx)
    : extractStore<OPTIONS>(ctx.root) || extractStore<OPTIONS>(ctx.parent);

  if ($store !== null) {
    return $store;
  }

  throw new Error("Could not retrieve $store from context");
};

/**
 * Extract the store from the target entity.
 *
 * @param target The target to pull the store from.
 */
const extractStore = <OPTIONS>(
  target: null | VueComponent
): Store<OPTIONS> | null => {
  if (target) {
    if (target.$store) {
      return target.$store as Store<OPTIONS>;
    }
    if (target.$children && target.$children[0] && target.$children[0].$store) {
      return target.$children[0].$store as Store<OPTIONS>;
    }
  }
  return null;
};

/**
 * Retrieves the state from a store.
 * @param s The store to get content from.
 */
export const state = <OPTIONS>(s: Store<OPTIONS>): State<OPTIONS> => s.state;

/**
 * Retrieves the getters from a store.
 * @param s The store to feed into the context.
 */
export const getters = <OPTIONS>(s: Store<OPTIONS>): Getters<OPTIONS> =>
  s.getters;

/**
 * Provides easy access to the mutations on the store.
 *
 * @param s The store to load commits from.
 */
export const commits = <OPTIONS>(s: Store<OPTIONS>): Commits<OPTIONS> => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => (payload?: any, options?: DispatchOptions) =>
        s.commit(prop as string, payload, options)
    }
  ) as any;
};

/**
 * Provides easy access to the actions on the store.
 *
 * @param s The store to load actions from.
 */
export const actions = <OPTIONS>(s: Store<OPTIONS>): Dispatches<OPTIONS> => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => (payload?: any, options?: DispatchOptions) =>
        s.dispatch(prop as string, payload, options)
    }
  ) as any;
};

/**
 * Retrieves the modules in a format that can be loaded into the other
 * convenience functions.
 *
 * @param s The store to load modules from.
 */
export const modules = <OPTIONS>(s: Store<OPTIONS>): Modules<OPTIONS> => {
  const mods = (s as any)._modules;
  const root = mods.__root || mods.root;
  const self = mods.__self || root;
  return new Proxy(self._children, {
    get: (children, prop) => {
      const mod = children[prop];
      if (mod) {
        const getterProxy = new Proxy(
          {},
          {
            get: (_, getter) => {
              const gets = mod._rawModule.getters;
              if (gets) {
                if (
                  "string" === typeof getter &&
                  Object.getOwnPropertyNames(gets).includes(getter)
                ) {
                  return gets[getter](
                    mod.state,
                    getterProxy,
                    root.state,
                    root.getters || s.getters
                  );
                }
                return gets[getter];
              }
              return void 0;
            }
          }
        );
        return {
          commit: mod.context.commit,
          dispatch: mod.context.dispatch,
          state: mod.state,
          getters: getterProxy,
          getChild: mod.getChild,
          _modules: {
            __root: root,
            __self: mod
          }
        };
      }
    }
  }) as Modules<OPTIONS>;
};

/**
 * Alias for `commits`.
 */
export const mutations = commits;

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
export const into = <T>($store: VStore<State<T>>): Store<T> => $store as any;

/**
 * Creates the full set of accessors from a store.
 *
 * @param $store The store to create accessors from.
 */
export const makeAccessors = <T>($store: Store<T>) => {
  const commit = commits($store);
  const dispatch = actions($store);
  return {
    state: state($store),
    commit,
    dispatch,
    mutations: commit,
    actions: dispatch,
    getters: getters($store),
    modules: modules($store)
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
  mutations
};

/*
 |-----------------------------------------------------------------------------
 | TYPES
 |-----------------------------------------------------------------------------
 */

/**
 * Extends the Vuex.Store type to ensure compatibility with Vuex-proper.
 */
export interface Store<OPTIONS> extends VStore<State<OPTIONS>> {
  readonly getters: Getters<OPTIONS>;
}

/**
 * Extract the state object from a literal or function, or else `never`.
 */
type State<OPTIONS> = OPTIONS extends { state: infer STATE }
  ? (STATE extends () => infer T ? T : STATE)
  : never;

/**
 * Extract the getters, or else `never`.
 */
type Getters<OPTIONS> = OPTIONS extends { getters: infer GETTERS }
  ? {
      [GETTER in keyof GETTERS]: Getter<GETTERS[GETTER]>;
    }
  : never;

/**
 * Extracts a single getter.
 */
type Getter<GETTER> = GETTER extends (...args: any[]) => infer T ? T : never;

/**
 * Extract the list of commits, or else `never`.
 */
type Commits<OPTIONS> = OPTIONS extends { mutations: infer MUTATIONS }
  ? {
      [MUTATION in keyof MUTATIONS]: Commit<MUTATIONS[MUTATION]>;
    }
  : never;

/**
 * Extracts a single committer.
 */
type Commit<MUTATION> = Payload<MUTATION> extends undefined
  ? (payload?: Payload<MUTATION>, options?: CommitOptions) => void
  : (payload: Payload<MUTATION>, options?: CommitOptions) => void;

/**
 * Extracts the list of actions, or else `never`.
 */
type Dispatches<OPTIONS> = OPTIONS extends { actions: infer ACTIONS }
  ? {
      [ACTION in keyof ACTIONS]: Dispatch<ACTIONS[ACTION]>;
    }
  : never;

/**
 * Extract a single action.
 */
type Dispatch<ACTION> = Payload<ACTION> extends undefined
  ? (
      payload?: Payload<ACTION>,
      options?: CommitOptions
    ) => OptionalReturnType<ACTION>
  : (
      payload: Payload<ACTION>,
      options?: CommitOptions
    ) => OptionalReturnType<ACTION>;

/**
 * Extracts the return type if FN is a function, or else `never`.
 */
type OptionalReturnType<FN> = FN extends (...args: any[]) => infer RET
  ? RET
  : never;

/**
 * Extract the modules, or else `never`.
 */
type Modules<OPTIONS> = OPTIONS extends { modules: infer MODULES }
  ? { [MODULE in keyof MODULES]: Store<MODULES[MODULE]> }
  : never;

/**
 * Extracts the payload type from a callback function.
 */
type Payload<F> = F extends (...args: infer T) => unknown ? T[1] : never;

type VueComponent = CombinedVueInstance<
  Vue,
  object,
  object,
  object,
  Record<never, any>
>;
