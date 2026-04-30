export default {
    preset: "ts-jest",
    testEnvironment: "node",
    collectCoverage: true,
    collectCoverageFrom: [
      "src/**/*.ts",
      "!src/index.ts" // 👈 ignora entrypoint
    ],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  };