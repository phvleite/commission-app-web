import mongoose, { Mongoose } from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI não definida nas variáveis de ambiente')
}

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
    if (cached.conn) return cached.conn

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI as string)
    }

    cached.conn = await cached.promise
    return cached.conn
}
