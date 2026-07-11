import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
    coverageProvider: 'v8',
    testEnvironment: 'node',
    testTimeout: 30000,
    maxWorkers: 1,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: ['<rootDir>/tests/**/*.test.(ts|tsx)'],
}

const jestConfigFn = createJestConfig(config)

export default async () => {
    const cfg = await jestConfigFn()
    return {
        ...cfg,
        transformIgnorePatterns: [
            'node_modules/(?!(bson|mongodb|mongoose|mongodb-memory-server|@mongodb-js)/)',
        ],
    }
}
