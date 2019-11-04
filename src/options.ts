export interface Options<S> {
  state: S | (() => S);
  getters?: {
    [key: string]: (...args: any[]) => any;
  };
  mutations?: MutationList;
  actions?: ActionList;
  modules?: ModuleList;
}

interface MutationList {
  [key: string]: (arg: any, payload?: any) => void;
}

interface ActionList {
  [key: string]: (arg: any, payload?: any) => Promise<any>;
}

interface ModuleList {
  [key: string]: Options<any>;
}
