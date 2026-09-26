import mongoose from 'mongoose'
import { config } from 'dotenv'

type MigrationDatabase = NonNullable<typeof mongoose.connection.db>

export async function withMigrationDatabase<T>(
    operation: (db: MigrationDatabase) => Promise<T>,
): Promise<T> {
    if (!process.env.MONGODB_URI) {
        config({ path: '.env.local' })
    }

    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI nao definida.')

    await mongoose.connect(uri)

    try {
        const db = mongoose.connection.db
        if (!db) throw new Error('Conexao com o banco nao disponivel.')
        return await operation(db)
    } finally {
        await mongoose.disconnect()
    }
}
