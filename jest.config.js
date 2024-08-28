export default {
  transform: {},
  testEnvironment: "node",
  testTimeout: 100000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    "**/__tests__/**/*.js?(x)",
    "**/?(*.)+(spec|test).js?(x)",
    "**/__tests__/**/*.mjs?(x)",
    "**/?(*.)+(spec|test).mjs?(x)"
  ]
};
