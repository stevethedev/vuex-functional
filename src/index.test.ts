// tslint:disable-next-line
import jsdom from "jsdom-global";

jsdom();

import vueCompositionApi, {
  createComponent,
  SetupContext
} from "@vue/composition-api";
// tslint:disable-next-line
import { createLocalVue, mount } from "@vue/test-utils";
import Vue from "vue";
import Vuex, { Store as VStore } from "vuex";
import V from ".";

const storeState = {
  string: "string",
  number: 1,
  null: null,
  undefined,
  array: [],
  object: { foo: "string" }
};

const storeOptions = {
  state: () => ({ ...storeState }),
  getters: {
    get_string: (state: typeof storeState) => state.string,
    get_number: (state: typeof storeState) => state.number,
    get_null: (state: typeof storeState) => state.null,
    get_undefined: (state: typeof storeState) => state.undefined,
    get_array: (state: typeof storeState) => state.array,
    get_object: (state: typeof storeState) => state.object
  },
  mutations: {
    SET_STRING: (state: typeof storeState, payload: { string: string }) =>
      (state.string = payload.string),
    SET_NUMBER: (state: typeof storeState, payload: { number: number }) =>
      (state.number = payload.number),
    NO_PARAM: () => void 0
  },
  actions: {
    action_payload: async (ctx, payload: { string: string }) => {
      ctx.commit("SET_STRING", payload);
      return true;
    },
    no_payload: async () => true
  },
  modules: {
    foo: { state: { baz: "baz" } },
    bar: {
      namespaced: true,
      state: { bar: "bar", number: 1 },
      mutations: {
        BAR_SET_STRING(this: VStore<any>, _, payload: string) {
          V.commits<typeof storeOptions>(this).SET_STRING({
            string: payload
          });
        }
      },
      getters: {
        get_number: state => state.number,
        get_number_sum: (
          state: any,
          getters: any,
          rootState: any,
          rootGetters: any
        ) => {
          return (
            state.number +
            getters.get_number +
            rootState.number +
            rootGetters.get_number
          );
        }
      }
    }
  }
};

const getVue = () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  localVue.use(vueCompositionApi);
  return localVue;
};

test("can read the store", () => {
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        expect(ctx).toBeTruthy();
        expect(V.store(ctx)).toBeTruthy();
        expect(V.store(ctx).commit).toBeTruthy();
        expect(V.store(ctx).dispatch).toBeTruthy();
        expect(V.store(ctx).state).toBeTruthy();
        expect(V.store(ctx).getters).toBeTruthy();

        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can convert vanilla Vuex store into a wrapped store", () => {
  const store = new Vuex.Store(storeOptions);

  const $store = V.into<typeof storeOptions>(store);

  expect($store).toBeDefined();
  expect($store).toBeInstanceOf(Vuex.Store);
  expect(($store as any) === (store as any)).toBeTruthy();
});

test("can read the state", () => {
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>(ctx);
        const $state = V.state($store);

        expect($state.array).toEqual(storeState.array);
        expect($state.null).toEqual(storeState.null);
        expect($state.number).toEqual(storeState.number);

        expect($state).toEqual($store.state);
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read getters", () => {
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>(ctx);
        const $getters = V.getters($store);

        expect($getters.get_array).toEqual(storeState.array);
        expect($getters.get_null).toEqual(storeState.null);
        expect($getters.get_number).toEqual(storeState.number);
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read mutations", () => {
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>(ctx);
        const $commit = V.commits($store);
        const $state = V.state($store);

        const num = Math.random();
        $commit.SET_NUMBER({ number: num });

        const str = Math.random().toString(32);
        $commit.SET_STRING({ string: str });

        $commit.NO_PARAM();

        expect($state.number).toEqual(num);
        expect($state.string).toEqual(str);
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read actions", done => {
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>(ctx);
        const $dispatch = V.actions($store);
        const $state = V.state($store);

        const str = Math.random().toString(32);

        Promise.all([
          $dispatch.action_payload({ string: str }),
          $dispatch.no_payload()
        ]).then(() => {
          expect($state.string).toEqual(str);
          done();
        });
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read modules", () => {
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>(ctx);
        const { foo: $foo, bar: $bar } = V.modules($store);

        expect(V.state($foo)).toEqual(($store.state as any).foo);
        expect(V.state($foo)).toBeTruthy();

        expect(V.state($bar)).toEqual(($store.state as any).bar);
        expect(V.state($bar)).toBeTruthy();
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read module getters", () => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = V.modules($store);

        const $getters = V.getters($storeOptions);

        expect($getters.get_array).toEqual(storeState.array);
        expect($getters.get_null).toEqual(storeState.null);
        expect($getters.get_number).toEqual(storeState.number);
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(newOptions)
    }
  );
});

test("can read module mutations", () => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = V.modules($store);

        const $commit = V.commits($storeOptions);
        const $state = V.state($storeOptions);

        const num = Math.random();
        $commit.SET_NUMBER({ number: num });

        const str = Math.random().toString(32);
        $commit.SET_STRING({ string: str });

        $commit.NO_PARAM();

        expect($state.number).toEqual(num);
        expect($state.string).toEqual(str);
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(newOptions)
    }
  );
});

test("can read module actions", done => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = V.modules($store);

        const $dispatch = V.actions($storeOptions);
        const $state = V.state($storeOptions);

        const str = Math.random().toString();

        Promise.all([
          $dispatch.action_payload({ string: str }),
          $dispatch.no_payload()
        ]).then(() => {
          expect($state.string).toEqual(str);
          done();
        });
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(newOptions)
    }
  );
});

test("can get values from actions", done => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = V.modules($store);

        const $dispatch = V.actions($storeOptions);

        const str = Math.random().toString();

        Promise.all([
          $dispatch.action_payload({ string: str }),
          $dispatch.no_payload()
        ]).then(([payload, no_payload]) => {
          expect(payload).toEqual(true);
          expect(no_payload).toEqual(true);
          done();
        });
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(newOptions)
    }
  );
});

test("can read module modules", () => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = V.modules($store);
        const { foo: $foo, bar: $bar } = V.modules($storeOptions);

        expect(V.state($foo)).toEqual(($store.state as any).storeOptions.foo);
        expect(V.state($foo)).toBeTruthy();

        expect(V.state($bar)).toEqual(($store.state as any).storeOptions.bar);
        expect(V.state($bar)).toBeTruthy();
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(newOptions)
    }
  );
});

test("can read non-namespaced module modules", () => {
  const newOptions = {
    state: {},
    modules: { storeOptions: { ...storeOptions, namespaced: false } }
  };
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = V.modules($store);
        const { foo: $foo, bar: $bar } = V.modules($storeOptions);

        expect(V.state($foo)).toEqual(($store.state as any).storeOptions.foo);
        expect(V.state($foo)).toBeTruthy();

        expect(V.state($bar)).toEqual(($store.state as any).storeOptions.bar);
        expect(V.state($bar)).toBeTruthy();
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(newOptions)
    }
  );
});

test("throws if the store is invalid", () => {
  expect(() => V.store(({} as any) as SetupContext)).toThrowError();
});

test("works on old-style components if the store is invalid", () => {
  mount(
    Vue.extend({
      template: "<div />",
      mounted() {
        const $store = V.store<typeof storeOptions>(this);

        expect($store).toBeTruthy();
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("doesn't break missing getter content", () => {
  mount(
    Vue.extend({
      template: "<div />",
      mounted() {
        const $store = V.store<typeof storeOptions>(this);

        expect((V.getters($store) as any)[1]).toBeUndefined();
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("make accessors", done => {
  mount(
    Vue.extend({
      template: "<div />",
      async mounted() {
        const $store = V.store<typeof storeOptions>(this);

        const accessors = V.makeAccessors($store);

        expect(accessors.getters.get_array).toEqual(
          V.getters($store).get_array
        );

        expect(V.state(accessors.modules.foo).baz).toEqual(
          V.state(V.modules($store).foo).baz
        );

        const num = 12345;

        accessors.commit.SET_NUMBER({ number: num });
        expect(accessors.getters.get_number).toEqual(num);

        expect(accessors.state.number).toEqual(num);

        await accessors.dispatch.no_payload();

        done();
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("access store from within store", () => {
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $bar = V.modules(V.store<typeof storeOptions>(ctx)).bar;
        V.commits($bar).BAR_SET_STRING("blablahblah");
        expect(V.state(V.store<typeof storeOptions>(ctx)).string).toEqual(
          "blablahblah"
        );
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("getters forward all properties", () => {
  mount(
    createComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>(ctx);
        const $bar = V.makeAccessors(V.modules($store).bar);

        // tslint:disable-next-line
        expect($bar.getters.get_number_sum).toEqual(4);
        return {};
      }
    } as any),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

// test("mutations can have optional payloads", () => {
//   const options = {
//     state: {},
//     mutations: {
//       requiredPayload: (_, _payload: { string: string }) => void 0,
//       optionalPayload: (_, _payload?: { string: string }) => void 0
//     }
//   };
//   const store = V.into<typeof options>(new Vuex.Store(options));

//   V.mutations(store).optionalPayload();
//   V.mutations(store).optionalPayload({ string: "test" });

//   V.mutations(store).requiredPayload({ string: "foo" });
//   V.mutations(store).requiredPayload();
// });

// test("actions can have optional payloads", () => {
//   const options = {
//     state: {},
//     actions: {
//       requiredPayload: (_, _payload: { string: string }) => void 0,
//       optionalPayload: (_, _payload?: { string: string }) => void 0
//     }
//   };
//   const store = V.into<typeof options>(new Vuex.Store(options));

//   V.actions(store).optionalPayload();
//   V.actions(store).optionalPayload({ string: "test" });

//   V.actions(store).requiredPayload({ string: "foo" });
// });
