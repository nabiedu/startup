module.exports = {
  testEnvironment: 'node',
  testTimeout: 20000,
  globalSetup: '<rootDir>/tests/jestGlobalSetup.js',
  globalTeardown: '<rootDir>/tests/jestGlobalTeardown.js',
  testMatch: ['**/tests/integration/**/*.test.js','**/?(*.)+(spec|test).[jt]s?(x)'],
};
