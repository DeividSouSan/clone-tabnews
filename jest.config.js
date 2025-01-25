const nextJest = require('next/jest');
const envConfig = require('@next/env');

process.env.NODE_ENV = 'development';
envConfig.loadEnvConfig('.', true);

const createJestConfig = nextJest();

const jestConfig = createJestConfig({
  moduleDirectories: ['node_modules', '<rootDir>']
});

module.exports = jestConfig;