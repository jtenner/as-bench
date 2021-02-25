module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ["**/*.spec.[jt]s"],
    testPathIgnorePatterns: ["/assembly/", "/node_modules/"],
  };
  