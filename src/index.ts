import { SetupContext } from "@vue/composition-api";
import { CombinedVueInstance, Vue } from "vue/types/vue";
import { CommitOptions, Store as VStore } from "vuex";

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
export const commits = <OPTIONS>(s: Store<OPTIONS>): CommitChains<OPTIONS> => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => (payload, options) =>
        (s.commit as any)(prop as keyof CommitChains<OPTIONS>, payload, options)
    }
  ) as any;
};

/**
 * Provides easy access to the actions on the store.
 *
 * @param s The store to load actions from.
 */
export const actions = <OPTIONS>(
  s: Store<OPTIONS>
): DispatchChains<OPTIONS> => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => (payload, options) =>
        (s.dispatch as any)(prop, payload, options)
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
        return {
          commit: mod.context.commit,
          dispatch: mod.context.dispatch,
          state: mod.state,
          getters: new Proxy(
            {},
            {
              get: (_, getter) => {
                const gets = mod._rawModule.getters;
                if (
                  "string" === typeof getter &&
                  Object.getOwnPropertyNames(gets).includes(getter)
                ) {
                  return gets[getter](mod.state);
                }
                return gets[getter];
              }
            }
          ),
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
 * Creates the full set of accessors from a store.
 *
 * @param $store The store to create accessors from.
 */
export const makeAccessors = <T>($store: Store<T>) => {
  return {
    state: state($store),
    commit: commits($store),
    dispatch: actions($store),
    getters: getters($store),
    modules: modules($store)
  };
};

/*
 |-----------------------------------------------------------------------------
 | TYPES
 |-----------------------------------------------------------------------------
 */

type Commits<OPTIONS> = OPTIONS extends { mutations: infer MUTATIONS }
  ? InternalCommits<MUTATIONS>
  : never;

type Modules<OPTIONS> = OPTIONS extends { modules: infer MODULES }
  ? { [MODULE in keyof MODULES]: Store<MODULES[MODULE]> }
  : never;

type Payload<F> = F extends (...args: infer T) => unknown ? T[1] : never;

interface InternalCommits<MUTATIONS> {
  <MUTATION extends keyof MUTATIONS>(
    type: MUTATION,
    payload: Payload<MUTATIONS[MUTATION]> extends undefined
      ? null
      : Payload<MUTATIONS[MUTATION]>,
    options?: CommitOptions
  ): void;
  <MUTATION extends keyof MUTATIONS>(
    payloadWithType: Payload<MUTATIONS[MUTATION]> extends undefined
      ? { type: MUTATION }
      : { type: MUTATION; payload: Payload<MUTATIONS[MUTATION]> },
    options?: CommitOptions
  ): void;
}

type CommitChains<OPTIONS> = OPTIONS extends { mutations: infer MUTATIONS }
  ? {
      [MUTATION in keyof MUTATIONS]: Payload<
        MUTATIONS[MUTATION]
      > extends undefined
        ? (payload?: null, options?: CommitOptions) => void
        : (
            payload: Payload<MUTATIONS[MUTATION]>,
            options?: CommitOptions
          ) => void;
    }
  : never;

type Dispatches<OPTIONS> = OPTIONS extends { actions: infer ACTIONS }
  ? InternalDispatches<ACTIONS>
  : never;

interface InternalDispatches<ACTIONS> {
  <ACTION extends keyof ACTIONS>(
    type: ACTION,
    payload: Payload<ACTIONS[ACTION]> extends undefined
      ? null
      : Payload<ACTIONS[ACTION]>,
    options?: CommitOptions
  ): ACTIONS[ACTION] extends () => infer T ? T : never;
  <ACTION extends keyof ACTIONS>(
    payloadWithType: Payload<ACTIONS[ACTION]> extends undefined
      ? { type: ACTION }
      : { type: ACTION; payload: Payload<ACTIONS[ACTION]> },
    options?: CommitOptions
  ): ACTIONS[ACTION] extends () => infer T ? T : never;
}

type DispatchChains<OPTIONS> = OPTIONS extends { actions: infer ACTIONS }
  ? {
      [ACTION in keyof ACTIONS]: Payload<ACTIONS[ACTION]> extends undefined
        ? (
            payload?: null,
            options?: CommitOptions
          ) => ACTIONS[ACTION] extends () => infer RET ? RET : never
        : (
            payload: Payload<ACTIONS[ACTION]>,
            options?: CommitOptions
          ) => ACTIONS[ACTION] extends () => infer RET ? RET : never;
    }
  : never;

interface Store<OPTIONS> extends VStore<State<OPTIONS>> {
  readonly state: State<OPTIONS>;

  readonly getters: Getters<OPTIONS>;

  commit: Commits<OPTIONS>;
  dispatch: Dispatches<OPTIONS>;
}

type State<OPTIONS> = OPTIONS extends { state: infer STATE }
  ? (STATE extends () => infer T ? T : STATE)
  : never;

type Getters<OPTIONS> = OPTIONS extends { getters: infer GETTERS }
  ? InternalGetters<GETTERS>
  : never;

type InternalGetters<GETTERS> = {
  [getter in keyof GETTERS]: GETTERS[getter] extends (...args: any[]) => infer T
    ? T
    : never;
};

const isComponent = (ctx: any): ctx is VueComponent => !!ctx.$store;

type VueComponent = CombinedVueInstance<
  Vue,
  object,
  object,
  object,
  Record<never, any>
>;
