# Vuex-Functional

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/2ec0befb33e6426bb85f60038fe62ca3)](https://www.codacy.com/manual/stevethedev/vuex-functional?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=stevethedev/vuex-functional&amp;utm_campaign=Badge_Grade)
[![CodeFactor](https://www.codefactor.io/repository/github/stevethedev/vuex-functional/badge)](https://www.codefactor.io/repository/github/stevethedev/vuex-functional)
[![Snyk](https://img.shields.io/snyk/vulnerabilities/github/stevethedev/vuex-functional)](https://img.shields.io/snyk/vulnerabilities/github/stevethedev/vuex-functional)

This TypeScript library provides a set of functions that reveal the committers,
dispatchers, getters, state, and modules of Vuex stores in the Vue-Composition
API. The goal of this project is to provide TypeScript hinting with low-overhead
and zero configuration.

## Browser Support

This library should work in any browser that supports ES6. It does, however, use
JavaScript Proxies — IE11 is not supported, and there are no plans to support it
in the future.

## Installation

```bash
npm i vuex-functional
```

## Usage

This section explains how to extract content from the store. For the following examples, this is the store file:

```typescript
const storeState = {
  string: "string",
  number: 1
};

export const options = {
  state: () => ({ ...storeState }),
  getters: {
    get_string: (state: typeof storeState) => state.string,
    get_number: (state: typeof storeState) => state.number
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
    bar: {
      namespaced: true,
      state: { bar: "bar", number: 1 },
      mutations: {
        BAR_SET_STRING(this: VStore<any>, state, payload: string) {
          state.bar = payload;
          commits<typeof options>(this).SET_STRING({
            string: payload
          });
        }
      }
    }
  }
};
```

### Get the Store object

Before the Store object can be retrieved, it must first be injected into the Vue application:

```typescript
import { createApp } from "vue"
import { createStore } from "vuex";

import { options } from "path/to/my/store";
import App from "path/to/App.vue";

createApp(App).use(createStore(options)).mount("#app");
```

Previous versions of this library supported `Vue.extend` and the Vue 2.0-compatible
Composition API. They are no longer supported.

```typescript
import { defineComponent } from "vue";
import { getters, store } from "vuex-functional";
import { options } from "path/to/my/store"; //< The options used to create the store

export default defineComponent({
  setup: (_, ctx) => {
    // Extracts the store
    const $store = store<typeof options>(ctx);

    //
    // Your code goes here
    //
  }
});
```

### Store state and getters

State and getters behave exactly the same way they would if you were to access
them directly.

```typescript
import { getters, state, store } from "vuex-functional";
import { options } from "path/to/my/store";

// ...

const $store = store<typeof options>(ctx);
const $state = state($store);
const $getters = getters($store);

$state.number; // 1
$getters.get_number; // 1
```

Also...

```
$store.state.number; // 1
$store.getters.get_number; // 1
```

### Store actions and mutations

Actions and mutations now use Proxies to forward the action or mutation name on
to the store. If you didn't define a payload in the function, then the payload
is either `null` or left blank; otherwise, TypeScript will automatically detect
the payload type and insert it into the tooltip.

```typescript
import { actions, mutations, state, store } from "vuex-functional";
import { options } from "path/to/my/store";

// ...

const $store = store<typeof options>(ctx);
const $actions = actions($store);
const $mutations = mutations($store);

$mutations.SET_NUMBER({ number: 9 });
await $actions.no_payload(); // `true`

state($store).number; // 9
```

### Store modules

Modules can also be extracted, and passed back into the other functions to
access their methods and state:

```typescript
import { actions, getters, modules, mutations, state, store } from "vuex-functional";
import { options } from "path/to/my/store";

// ...

const $store = store<typeof options>(ctx);

const $barModule = modules($store).bar;

// This mutation forwards to the main store
mutations($barModule).BAR_SET_STRING("hello, world!");

state($store).string; // "hello, world!"
state($barModule).bar; // "hello, world!"
```

### All accessors at once

```typescript
import { makeAccessors, store } from "vuex-functional";
import { options } from "path/to/my/store";

// ...

const $store = store<typeof options>(ctx);

const { commit: $commit, dispatch: $dispatch, state: $state, getters: $getters } = makeAccessors($store);

//
// Your code here
//
```
