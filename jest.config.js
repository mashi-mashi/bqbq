module.exports = {
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  rootDir: './',
  roots: ['src'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).[tj]s?(x)', '**/src/test/**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
    },
  },
};
