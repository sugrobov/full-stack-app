module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  moduleDirectories: ['node_modules', 'src'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js'
  ], 
   transformIgnorePatterns: [
    '/node_modules/(?!(uuid|file-type)/)'
  ],
};