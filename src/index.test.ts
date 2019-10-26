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
import Vuex from "vuex";
import * as TypedVuex from ".";

const storeState = {
  string: "string",
  number: 1,
  null: null,
  undefined,
  array: [],
  object: {}
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
      state: { bar: "bar" },
      mutations: {
        BAR_SET_STRING(_, payload: string) {
          TypedVuex.commits<typeof storeOptions>(this as any).SET_STRING({
            string: payload
          });
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
        expect(TypedVuex.store(ctx)).toBeTruthy();
        expect(TypedVuex.store(ctx).commit).toBeTruthy();
        expect(TypedVuex.store(ctx).dispatch).toBeTruthy();
        expect(TypedVuex.store(ctx).state).toBeTruthy();
        expect(TypedVuex.store(ctx).getters).toBeTruthy();
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
        const $store = TypedVuex.store<typeof storeOptions>(ctx);
        const $state = TypedVuex.state($store);

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
        const $store = TypedVuex.store<typeof storeOptions>(ctx);
        const $getters = TypedVuex.getters($store);

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
        const $store = TypedVuex.store<typeof storeOptions>(ctx);
        const $commit = TypedVuex.commits($store);
        const $state = TypedVuex.state($store);

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
        const $store = TypedVuex.store<typeof storeOptions>(ctx);
        const $dispatch = TypedVuex.actions($store);
        const $state = TypedVuex.state($store);

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
        const $store = TypedVuex.store<typeof storeOptions>(ctx);
        const { foo: $foo, bar: $bar } = TypedVuex.modules($store);

        expect(TypedVuex.state($foo)).toEqual(($store.state as any).foo);
        expect(TypedVuex.state($foo)).toBeTruthy();

        expect(TypedVuex.state($bar)).toEqual(($store.state as any).bar);
        expect(TypedVuex.state($bar)).toBeTruthy();
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
        const $store = TypedVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = TypedVuex.modules($store);

        const $getters = TypedVuex.getters($storeOptions);

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
        const $store = TypedVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = TypedVuex.modules($store);

        const $commit = TypedVuex.commits($storeOptions);
        const $state = TypedVuex.state($storeOptions);

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
        const $store = TypedVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = TypedVuex.modules($store);

        const $dispatch = TypedVuex.actions($storeOptions);
        const $state = TypedVuex.state($storeOptions);

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
        const $store = TypedVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = TypedVuex.modules($store);
        const { foo: $foo, bar: $bar } = TypedVuex.modules($storeOptions);

        expect(TypedVuex.state($foo)).toEqual(
          ($store.state as any).storeOptions.foo
        );
        expect(TypedVuex.state($foo)).toBeTruthy();

        expect(TypedVuex.state($bar)).toEqual(
          ($store.state as any).storeOptions.bar
        );
        expect(TypedVuex.state($bar)).toBeTruthy();
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
        const $store = TypedVuex.store<typeof newOptions>(ctx);
        const { storeOptions: $storeOptions } = TypedVuex.modules($store);
        const { foo: $foo, bar: $bar } = TypedVuex.modules($storeOptions);

        expect(TypedVuex.state($foo)).toEqual(
          ($store.state as any).storeOptions.foo
        );
        expect(TypedVuex.state($foo)).toBeTruthy();

        expect(TypedVuex.state($bar)).toEqual(
          ($store.state as any).storeOptions.bar
        );
        expect(TypedVuex.state($bar)).toBeTruthy();
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(newOptions)
    }
  );
});

test("throws if the store is invalid", () => {
  expect(() => TypedVuex.store(({} as any) as SetupContext)).toThrowError();
});

test("works on old-style components if the store is invalid", () => {
  mount(
    Vue.extend({
      template: "<div />",
      mounted() {
        const $store = TypedVuex.store<typeof storeOptions>(this);

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
        const $store = TypedVuex.store<typeof storeOptions>(this);

        expect((TypedVuex.getters($store) as any)[1]).toBeUndefined();
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
        const $store = TypedVuex.store<typeof storeOptions>(this);

        const accessors = TypedVuex.makeAccessors($store);

        expect(accessors.getters.get_array).toEqual(
          TypedVuex.getters($store).get_array
        );

        expect(TypedVuex.state(accessors.modules.foo).baz).toEqual(
          TypedVuex.state(TypedVuex.modules($store).foo).baz
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
        const $bar = TypedVuex.modules(
          TypedVuex.store<typeof storeOptions>(ctx)
        ).bar;
        TypedVuex.commits($bar).BAR_SET_STRING("blablahblah");
        expect(
          TypedVuex.state(TypedVuex.store<typeof storeOptions>(ctx)).string
        ).toEqual("blablahblah");
      }
    }),
    {
      localVue: getVue(),
      store: new Vuex.Store(storeOptions)
    }
  );
});
