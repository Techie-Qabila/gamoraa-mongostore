import Server, { GrpcServerCallContext, GrpcServerMiddleware } from 'gamoraa'
import { Connection, Model } from 'mongoose'

export type roleResolveHandler = (
    context: GrpcServerCallContext<any, any>
) => Promise<string>

export interface ModelRouteConfig {
    readonly disable?: boolean
    readonly checkPermission?: boolean
    readonly middleware?:
        | GrpcServerMiddleware<any, any>
        | ReadonlyArray<GrpcServerMiddleware<any, any>>
    roleResolver?: roleResolveHandler
}

export interface ModelServiceConfig {
    readonly model: Model<any>
    readonly readRoles?: ReadonlyArray<string>
    readonly writeRoles?: ReadonlyArray<string>
    readonly create?: ModelRouteConfig
    readonly insertMany?: ModelRouteConfig
    readonly findById?: ModelRouteConfig
    readonly findOne?: ModelRouteConfig
    readonly find?: ModelRouteConfig
    readonly findAndStreamResponse?: ModelRouteConfig
    readonly findLive?: ModelRouteConfig
    readonly findByIdAndUpdate?: ModelRouteConfig
    readonly findOneAndUpdate?: ModelRouteConfig
    readonly updateMany?: ModelRouteConfig
    readonly findByIdAndDelete?: ModelRouteConfig
    readonly findOneAndDelete?: ModelRouteConfig
    readonly deleteMany?: ModelRouteConfig
    readonly countDocuments?: ModelRouteConfig
    readonly estimatedDocumentCount?: ModelRouteConfig
    readonly watch?: ModelRouteConfig
}

export interface MongoStoreServiceConfig {
    readonly middleware?:
        | GrpcServerMiddleware<any, any>
        | ReadonlyArray<GrpcServerMiddleware<any, any>>
    readonly connection?: Connection
    readonly modelsOptions?: ReadonlyArray<ModelServiceConfig>
}

export enum ActionType {
    Create,
    Read,
    Update,
    Delete,
}
