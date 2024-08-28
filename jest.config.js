// export default {
//     transform: {},
//     extensionsToTreatAsEsm: ['.ts'],
//     moduleNameMapper: {
//       '^(\\.{1,2}/.*)\\.js$': '$1',
//     },
//     testEnvironment: 'node',
// };

export default {
  transform: {},
  testEnvironment: "node",
  testTimeout: 100000, // Increase default timeout to 10 seconds
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    "**/__tests__/**/*.js?(x)",
    "**/?(*.)+(spec|test).js?(x)",
    "**/__tests__/**/*.mjs?(x)",
    "**/?(*.)+(spec|test).mjs?(x)"
  ],
};
