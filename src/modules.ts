import { Options } from "./options";
import { Store } from "./store";

import { State } from "./state";

const $root = Symbol();
const $self = Symbol();

/**
 * Retrieves the modules in a format that can be loaded into the other
 * convenience functions.
 *
 * @param s The store to load modules from.
 */
export const modules = <O extends Options<any>>(
  store: Store<O>
): Modules<O> => {
  // TODO: Apply paths to the root store to do this.
  const mods = (store as Module<O>)._modules;
  const root: VModule<any> = mods[$root] || (mods as any).root;
  const self: VModule<O> = mods[$self] || root;

  return new Proxy(self._children, {
    get: (children, prop: keyof typeof children) => {
      const mod: VModule<any> | undefined = children[prop];
      if (mod) {
        const getterProxy = new Proxy(mod._rawModule.getters || {}, {
          get: (getters, getter: keyof typeof getters) => {
            if (getters) {
              if (
                "string" === typeof getter &&
                Object.getOwnPropertyNames(getters).includes(getter)
              ) {
                return getters[getter](
                  mod.state,
                  getterProxy,
                  root.state,
                  root.getters || store.getters
                );
              }
              return getters[getter];
            }
            return void 0;
          }
        });
        return {
          commit: mod.context.commit,
          dispatch: mod.context.dispatch,
          state: mod.state,
          getters: getterProxy,
          _modules: {
            [$root]: root,
            [$self]: mod
          }
        };
      }
    }
  }) as any;
};

/**
 * Extract the modules, or else `never`.
 */
type Modules<O extends Options<any>> = {
  [M in keyof O["modules"]]: O["modules"][M] extends Options<any>
    ? Store<O["modules"][M]>
    : never;
};

interface Module<O extends Options<any>> extends Store<O> {
  _modules: VModuleCollection;
}

interface VModule<O extends Options<any>> extends Store<O> {
  _children: { [key: string]: VModule<Options<any>> };
  _rawModule: O;
  state: State<O>;
  context: {
    commit: (tag: string, payload?: any) => void;
    dispatch: (tag: string, payload?: any) => Promise<any>;
  };

  addChild(key: string, module: VModule<Options<any>>): void;
  removeChild(key: string): void;
  getChild(key: string): VModule<Options<any>> | void;
}

interface VModuleCollection {
  get(path: string[]): VModule<Options<any>> | undefined;
  getNamespace(path: string[]): string;
}
