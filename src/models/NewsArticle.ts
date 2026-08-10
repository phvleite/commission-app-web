import { Document, model, models, Schema, Types } from 'mongoose'

export interface INewsArticle {
    _id: Types.ObjectId
    title: string
    description: string
    image?: string
    source: string
    url: string
    publishedAt: Date
    categories: string[]
    syncedAt: Date
    expiresAt: Date
}

export type NewsArticleDocument = INewsArticle & Document

const newsArticleSchema = new Schema<NewsArticleDocument>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        image: { type: String, trim: true },
        source: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        publishedAt: { type: Date, required: true, index: true },
        categories: { type: [String], default: ['geral'] },
        syncedAt: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true },
)

newsArticleSchema.index({ url: 1 }, { unique: true })
newsArticleSchema.index({ categories: 1, publishedAt: -1 })
newsArticleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const NewsArticle =
    models.NewsArticle ?? model<NewsArticleDocument>('NewsArticle', newsArticleSchema)
