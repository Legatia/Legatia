module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/setupTests.js'],
  moduleNameMapper: {
    '^@dfinity/(.*)$': '<rootDir>/node_modules/@dfinity/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\.(ts|tsx)$' : 'ts-jest',
    '^.+\.(js|jsx)$' : 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@dfinity|html5-qrcode)/).+',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};