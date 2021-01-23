import { StoreOptions } from 'vuex';

export interface Options<S> extends StoreOptions<S> {
  state: S | (() => S);
  getters?: GetterList;
  mutations?: MutationList;
  actions?: ActionList;
  modules?: ModuleList;
}

interface GetterList {
  [key: string]: (...args: any[]) => any;
}

interface MutationList {
  [key: string]: (arg: any, payload?: any) => void;
}

interface ActionList {
  [key: string]: ((arg: any, payload?: any) => Promise<any>) | ((arg: any, payload?: any) => void);
}

interface ModuleList {
  [key: string]: Options<any>;
}
