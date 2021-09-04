
module.exports = {
  // projects: [
  //     "<rootDir>/src/*"
  // ],
  preset: "ts-jest",
  testEnvironment: "node",

  rootDir: "./",
  testRegex: [".spec.ts$", ".unit.ts$", ".test.ts$"],
  moduleFileExtensions: ['ts', 'js'],
  setupFiles: ['<rootDir>/jest.config.js'],
}