import mongoose, { Mongoose } from 'mongoose'

interface MongooseCache {
    conn: Mongoose | null
    promise: Promise<Mongoose> | null
}

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
global.mongooseCache = cached

export async function connectDB(): Promise<Mongoose> {
    if (mongoose.connection.readyState === 1) {
        return mongoose
    }

    const mongoUri = process.env.MONGODB_URI

    if (!mongoUri) {
        throw new Error('MONGODB_URI não definida nas variáveis de ambiente')
    }

    if (cached.conn) return cached.conn

    if (!cached.promise) {
        cached.promise = mongoose.connect(mongoUri)
    }

    cached.conn = await cached.promise
    return cached.conn
}
