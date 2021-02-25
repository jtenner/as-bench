module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: [
      "**/src/*.ts"
    ],
    testMatch: ["**/*.spec.[jt]s"],
    testPathIgnorePatterns: ["/assembly/", "/node_modules/"],
  };
  