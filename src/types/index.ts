import { Types } from 'mongoose'

export interface WithTenant {
    tenantId: Types.ObjectId
}

export interface WithTimestamps {
    createdAt: Date
    updatedAt: Date
}
