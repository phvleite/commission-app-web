import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

let mongod: MongoMemoryReplSet | null = null

export async function connectTestDB(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
        return
    }

    mongod = await MongoMemoryReplSet.create({
        instanceOpts: [{ launchTimeout: 30000 }],
        replSet: {
            count: 1,
        },
    })

    await mongoose.connect(mongod.getUri(), {
        serverSelectionTimeoutMS: 30000,
    })
}

export async function disconnectTestDB(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase()
        await mongoose.connection.close()
    }

    if (mongod) {
        await mongod.stop()
        mongod = null
    }
}

export async function clearTestDB(): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
        return
    }

    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
}
