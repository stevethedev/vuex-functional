/**
 * Configures Jest testing framework to work with this project.
 *
 * Jest (https://jestjs.io/) is a JavaScript Testing Framework with a focus on
 * simplicity. It explicitly works with TypeScript, Babel, and Vue. It takes
 * very little configuration to get working, uses a fairly straightforward API,
 * and each test is run in its own environment to prevent collisions that could
 * change the validity of a test.
 *
 * One of the significant changes that this file makes to the default
 * configuration is that we are enabling TypeScript checking by using `ts-jest`
 * as an intermediate compilation step.
 *
 *   - Execute the tests with the `--coverage` flag to generate a
 *     coverage report.
 *
 *   - Due to the way the Vue Test Utils were built, we must have babel-core
 *     installed or else this will immediately fail.
 *
 */
module.exports = {
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(j|t)sx?$",
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "src"],
  modulePaths: ["<rootDir>/src", "<rootDir>/node_modules"],
  moduleFileExtensions: ["js", "json", "ts", "vue"],
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.(vue)$": "vue-jest"
  },
  roots: ["<rootDir>/src"],
  globals: { NODE_ENV: "test" }
};
