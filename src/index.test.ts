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
import * as FunctionalVuex from ".";

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
          FunctionalVuex.commits<typeof storeOptions>(this).SET_STRING({
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
      template: "<div />",
      setup: (_, ctx) => {
        expect(ctx).toBeTruthy();
        expect(FunctionalVuex.store(ctx)).toBeTruthy();
        expect(FunctionalVuex.store(ctx).commit).toBeTruthy();
        expect(FunctionalVuex.store(ctx).dispatch).toBeTruthy();
        expect(FunctionalVuex.store(ctx).state).toBeTruthy();
        expect(FunctionalVuex.store(ctx).getters).toBeTruthy();
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read the state", () => {
  mount(
    createComponent({
      template: "<div />",
      setup: (_, ctx) => {
        const $store = FunctionalVuex.store<typeof storeOptions>(ctx);
        const $state = FunctionalVuex.state($store);

        expect($state.array).toEqual(storeState.array);
        expect($state.null).toEqual(storeState.null);
        expect($state.number).toEqual(storeState.number);

        expect($state).toEqual($store.state);
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read getters", () => {
  mount(
    createComponent({
      template: "<div />",
      setup: (_, ctx) => {
        const $store = FunctionalVuex.store<typeof storeOptions>(ctx);
        const $getters = FunctionalVuex.getters($store);

        expect($getters.get_array).toEqual(storeState.array);
        expect($getters.get_null).toEqual(storeState.null);
        expect($getters.get_number).toEqual(storeState.number);
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read mutations", () => {
  mount(
    createComponent({
      template: "<div />",
      setup: (_, ctx) => {
        const $store = FunctionalVuex.store<typeof storeOptions>(ctx);
        const $commit = FunctionalVuex.commits($store);
        const $state = FunctionalVuex.state($store);

        const num = Math.random();
        $commit.SET_NUMBER({ number: num });

        const str = Math.random().toString(32);
        $commit.SET_STRING({ string: str });

        $commit.NO_PARAM();

        expect($state.number).toEqual(num);
        expect($state.string).toEqual(str);
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read actions", done => {
  mount(
    createComponent({
      template: "<div />",
      setup: async (_, ctx) => {
        const $store = FunctionalVuex.store<typeof storeOptions>(ctx);
        const $dispatch = FunctionalVuex.actions($store);
        const $state = FunctionalVuex.state($store);

        const str = Math.random().toString(32);

        await Promise.all([
          $dispatch.action_payload({ string: str }),
          $dispatch.no_payload()
        ]);

        expect($state.string).toEqual(str);

        done();
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("can read modules", () => {
  mount(
    createComponent({
      template: "<div />",
      setup: (_, ctx) => {
        const $store = FunctionalVuex.store<typeof storeOptions>(ctx);
        const { foo: $foo, bar: $bar } = FunctionalVuex.modules($store);

        expect(FunctionalVuex.state($foo)).toEqual(($store.state as any).foo);
        expect(FunctionalVuex.state($foo)).toBeTruthy();

        expect(FunctionalVuex.state($bar)).toEqual(($store.state as any).bar);
        expect(FunctionalVuex.state($bar)).toBeTruthy();
      }
    }),
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
      template: "<div />",
      setup: (_, ctx) => {
        const $store = FunctionalVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = FunctionalVuex.modules($store);

        const $getters = FunctionalVuex.getters($storeOptions);

        expect($getters.get_array).toEqual(storeState.array);
        expect($getters.get_null).toEqual(storeState.null);
        expect($getters.get_number).toEqual(storeState.number);
      }
    }),
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
      template: "<div />",
      setup: (_, ctx) => {
        const $store = FunctionalVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = FunctionalVuex.modules($store);

        const $commit = FunctionalVuex.commits($storeOptions);
        const $state = FunctionalVuex.state($storeOptions);

        const num = Math.random();
        $commit.SET_NUMBER({ number: num });

        const str = Math.random().toString(32);
        $commit.SET_STRING({ string: str });

        $commit.NO_PARAM();

        expect($state.number).toEqual(num);
        expect($state.string).toEqual(str);
      }
    }),
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
      template: "<div />",
      setup: async (_, ctx) => {
        const $store = FunctionalVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = FunctionalVuex.modules($store);

        const $dispatch = FunctionalVuex.actions($storeOptions);
        const $state = FunctionalVuex.state($storeOptions);

        const str = Math.random().toString();

        await Promise.all([
          $dispatch.action_payload({ string: str }),
          $dispatch.no_payload()
        ]);

        expect($state.string).toEqual(str);

        done();
      }
    }),
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
      template: "<div />",
      setup: (_, ctx) => {
        const $store = FunctionalVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = FunctionalVuex.modules($store);
        const { foo: $foo, bar: $bar } = FunctionalVuex.modules($storeOptions);

        expect(FunctionalVuex.state($foo)).toEqual(
          ($store.state as any).storeOptions.foo
        );
        expect(FunctionalVuex.state($foo)).toBeTruthy();

        expect(FunctionalVuex.state($bar)).toEqual(
          ($store.state as any).storeOptions.bar
        );
        expect(FunctionalVuex.state($bar)).toBeTruthy();
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(newOptions)
    }
  );
});

test("can read non-namespaced module modules", () => {
  const newOptions = {
    modules: { storeOptions: { ...storeOptions, namespaced: false } }
  };
  mount(
    createComponent({
      template: "<div />",
      setup: (_, ctx) => {
        const $store = FunctionalVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = FunctionalVuex.modules($store);
        const { foo: $foo, bar: $bar } = FunctionalVuex.modules($storeOptions);

        expect(FunctionalVuex.state($foo)).toEqual(
          ($store.state as any).storeOptions.foo
        );
        expect(FunctionalVuex.state($foo)).toBeTruthy();

        expect(FunctionalVuex.state($bar)).toEqual(
          ($store.state as any).storeOptions.bar
        );
        expect(FunctionalVuex.state($bar)).toBeTruthy();
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(newOptions)
    }
  );
});

test("throws if the store is invalid", () => {
  expect(() =>
    FunctionalVuex.store(({} as any) as SetupContext)
  ).toThrowError();
});

test("works on old-style components if the store is invalid", () => {
  mount(
    Vue.extend({
      template: "<div />",
      mounted() {
        const $store = FunctionalVuex.store<typeof storeOptions>(this);

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
        const $store = FunctionalVuex.store<typeof storeOptions>(this);

        expect((FunctionalVuex.getters($store) as any)[1]).toBeUndefined();
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
        const $store = FunctionalVuex.store<typeof storeOptions>(this);

        const accessors = FunctionalVuex.makeAccessors($store);

        expect(accessors.getters.get_array).toEqual(
          FunctionalVuex.getters($store).get_array
        );

        expect(FunctionalVuex.state(accessors.modules.foo).baz).toEqual(
          FunctionalVuex.state(FunctionalVuex.modules($store).foo).baz
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
      template: "<div />",
      setup: (_, ctx) => {
        const $bar = FunctionalVuex.modules(
          FunctionalVuex.store<typeof storeOptions>(ctx)
        ).bar;
        FunctionalVuex.commits($bar).BAR_SET_STRING("blablahblah");
        expect(
          FunctionalVuex.state(FunctionalVuex.store<typeof storeOptions>(ctx))
            .string
        ).toEqual("blablahblah");
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("getters forward all properties", () => {
  mount(
    createComponent({
      template: "<div />",
      setup: (_, ctx) => {
        const $store = FunctionalVuex.store<typeof storeOptions>(ctx);
        const $bar = FunctionalVuex.makeAccessors(
          FunctionalVuex.modules($store).bar
        );

        // tslint:disable-next-line
        expect($bar.getters.get_number_sum).toEqual(4);
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});

test("mutations can have optional payloads", () => {
  const options = {
    state: {},
    mutations: {
      requiredPayload: (_, _payload: { string: string }) => void 0,
      optionalPayload: (_, _payload?: { string: string }) => void 0
    }
  };
  const store = FunctionalVuex.into<typeof options>(new Vuex.Store(options));

  FunctionalVuex.mutations(store).optionalPayload();
  FunctionalVuex.mutations(store).optionalPayload({ string: "test" });

  FunctionalVuex.mutations(store).requiredPayload({ string: "foo" });
});

test("actions can have optional payloads", () => {
  const options = {
    state: {},
    actions: {
      requiredPayload: (_, _payload: { string: string }) => void 0,
      optionalPayload: (_, _payload?: { string: string }) => void 0
    }
  };
  const store = FunctionalVuex.into<typeof options>(new Vuex.Store(options));

  FunctionalVuex.actions(store).optionalPayload();
  FunctionalVuex.actions(store).optionalPayload({ string: "test" });

  FunctionalVuex.actions(store).requiredPayload({ string: "foo" });
});
