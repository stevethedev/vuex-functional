import "jsdom-global/register";

import {
  defineComponent,
  SetupContext
} from "vue";

import { mount } from "@vue/test-utils";
import { createStore, Store as VStore } from "vuex";
import V from ".";

(global as any).ShadowRoot = (global as any).ShadowRoot || function ShadowRoot() {};

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

test("can read the store", () => { 
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, ctx: SetupContext) => {
        expect(ctx).toBeTruthy();
        expect(V.store()).toBeTruthy();
        expect(V.store().commit).toBeTruthy();
        expect(V.store().dispatch).toBeTruthy();
        expect(V.store().state).toBeTruthy();
        expect(V.store().getters).toBeTruthy();

        return {};
      }
    }),
    { global: { plugins: [createStore(storeOptions)] } }
  );
});

test("can convert vanilla Vuex store into a wrapped store", () => {
  const store = createStore(storeOptions);

  const $store = V.into<typeof storeOptions>(store);

  expect($store).toBeDefined();
  expect(($store) === (store as any)).toBeTruthy();
});

test("can read the state", () => {
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>();
        const $state = V.state($store);

        expect($state.array).toEqual(storeState.array);
        expect($state.null).toEqual(storeState.null);
        expect($state.number).toEqual(storeState.number);

        expect($state).toEqual($store.state);
        return {};
      }
    }),
    { global: { plugins: [createStore(storeOptions)] } }
  );
});

test("can read getters", () => {
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>();
        const $getters = V.getters($store);

        expect($getters.get_array).toEqual(storeState.array);
        expect($getters.get_null).toEqual(storeState.null);
        expect($getters.get_number).toEqual(storeState.number);
        return {};
      }
    }),
    { global: { plugins: [createStore(storeOptions)] } }
  );
});

test("can read mutations", () => {
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>();
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
    }),
    { global: { plugins: [createStore(storeOptions)] } }
  );
});

test("can read actions", done => {
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>();
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
    }),
    { global: { plugins: [createStore(storeOptions)] } }
  );
});

test("can read modules", () => {
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>();
        const { foo: $foo, bar: $bar } = V.modules($store);

        expect(V.state($foo)).toEqual(($store.state as any).foo);
        expect(V.state($foo)).toBeTruthy();

        expect(V.state($bar)).toEqual(($store.state as any).bar);
        expect(V.state($bar)).toBeTruthy();
        return {};
      }
    }),
    { global: { plugins: [createStore(storeOptions)] } }
  );
});

test("can read module getters", () => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>();
        const { storeOptions: $storeOptions } = V.modules($store);

        const $getters = V.getters($storeOptions);

        expect($getters.get_array).toEqual(storeState.array);
        expect($getters.get_null).toEqual(storeState.null);
        expect($getters.get_number).toEqual(storeState.number);
        return {};
      }
    }),
    { global: { plugins: [createStore(newOptions)] } }
  );
});

test("can read module mutations", () => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>();
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
    }),
    { global: { plugins: [createStore(newOptions)] } }
  );
});

test("can read module actions", done => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>();
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
    }),
    { global: { plugins: [createStore(newOptions)] } }
  );
});

test("can get values from actions", done => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>();
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
    }),
    { global: { plugins: [createStore(newOptions)] } }
  );
});

test("can read module modules", () => {
  const newOptions = {
    ...storeOptions,
    modules: { storeOptions: { ...storeOptions, namespaced: true } }
  };
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>();
        const { storeOptions: $storeOptions } = V.modules($store);
        const { foo: $foo, bar: $bar } = V.modules($storeOptions);

        expect(V.state($foo)).toEqual(($store.state as any).storeOptions.foo);
        expect(V.state($foo)).toBeTruthy();

        expect(V.state($bar)).toEqual(($store.state as any).storeOptions.bar);
        expect(V.state($bar)).toBeTruthy();
        return {};
      }
    }),
    { global: { plugins: [createStore(newOptions)] } }
  );
});

test("can read non-namespaced module modules", () => {
  const newOptions = {
    state: {},
    modules: { storeOptions: { ...storeOptions, namespaced: false } }
  };
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof newOptions>();
        const { storeOptions: $storeOptions } = V.modules($store);
        const { foo: $foo, bar: $bar } = V.modules($storeOptions);

        expect(V.state($foo)).toEqual(($store.state as any).storeOptions.foo);
        expect(V.state($foo)).toBeTruthy();

        expect(V.state($bar)).toEqual(($store.state as any).storeOptions.bar);
        expect(V.state($bar)).toBeTruthy();
        return {};
      }
    }),
    { global: { plugins: [createStore(newOptions)] } }
  );
});

test("throws if the store is invalid", () => {
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        expect(() => V.store()).toThrowError();
        return {};
      }
    })
  );
});

test("access store from within store", () => {
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $bar = V.modules(V.store<typeof storeOptions>()).bar;
        V.commits($bar).BAR_SET_STRING("blablahblah");
        expect(V.state(V.store<typeof storeOptions>()).string).toEqual(
          "blablahblah"
        );
        return {};
      }
    }),
    { global: { plugins: [createStore(storeOptions)] } }
  );
});

test("getters forward all properties", () => {
  mount(
    defineComponent({
      template: "<div></div>",
      setup: (_props: never, _ctx: SetupContext) => {
        const $store = V.store<typeof storeOptions>();
        const $bar = V.makeAccessors(V.modules($store).bar);

        // eslint-disable-next-line
        expect($bar.getters.get_number_sum).toEqual(4);
        return {};
      }
    }),
    { global: { plugins: [createStore(storeOptions)] } }
  );
});

test("mutations can have optional payloads", () => {
  const options = {
    state: {},
    mutations: {
      requiredPayload: (_: any, _payload: { string: string }) => void 0,
      optionalPayload: (_: any, _payload?: { string: string }) => void 0
    }
  };
  const store = V.into<typeof options>(createStore(options));

  V.mutations(store).optionalPayload();
  V.mutations(store).optionalPayload({ string: "test" });

  V.mutations(store).requiredPayload({ string: "foo" });
});

test("actions can have optional payloads", () => {
  const options = {
    state: {},
    actions: {
      requiredPayload: (_: any, _payload: { string: string }) => Promise.resolve(),
      optionalPayload: (_: any, _payload?: { string: string }) => Promise.resolve(),
    }
  };
  const store = V.into<typeof options>(createStore(options));

  V.actions(store).optionalPayload();
  V.actions(store).optionalPayload({ string: "test" });

  V.actions(store).requiredPayload({ string: "foo" });
});
