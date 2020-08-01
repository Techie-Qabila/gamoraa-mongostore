import _ from 'lodash'
import GrpcBoom from 'grpc-boom'
import { ChangeStream } from 'mongodb'
import { Model, QueryCursor } from 'mongoose'
import {
    GrpcServerMiddleware,
    GrpcServerCallContext,
    onMiddieComplete,
    Middie,
} from 'gamoraa'
import { ModelRouteConfig, ModelServiceConfig, ActionType } from '../types'
import { jsonParse } from './json-utils'
import { transformObjKeys } from './map-obj'

/**
 *
 * @param routeConfig
 */
function getModelRouteWithDefaults(
    routeConfig: ModelRouteConfig | undefined
): ModelRouteConfig {
    const newRouteConfig: ModelRouteConfig = {
        disable: false,
        checkPermission: false,
        ...(routeConfig != undefined ? routeConfig : {}),
    }
    return newRouteConfig
}

/**
 *
 * @param modelOptions
 */
export function createModelsMap(
    modelOptions: ReadonlyArray<ModelServiceConfig>
): Record<string, ModelServiceConfig> {
    const modelsMap: Record<string, ModelServiceConfig> = {}
    for (const modelOpt of modelOptions) {
        const {
            create,
            insertMany,
            findById,
            findOne,
            find,
            findAndStreamResponse,
            findLive,
            findByIdAndUpdate,
            findOneAndUpdate,
            updateMany,
            findByIdAndDelete,
            findOneAndDelete,
            deleteMany,
            countDocuments,
            estimatedDocumentCount,
            watch,
        } = modelOpt

        const newModelServiceConfig: ModelServiceConfig = {
            ...modelOpt,
            create: getModelRouteWithDefaults(create),
            insertMany: getModelRouteWithDefaults(insertMany),
            findById: getModelRouteWithDefaults(findById),
            findOne: getModelRouteWithDefaults(findOne),
            find: getModelRouteWithDefaults(find),
            findAndStreamResponse: getModelRouteWithDefaults(
                findAndStreamResponse
            ),
            findLive: getModelRouteWithDefaults(findLive),
            findByIdAndUpdate: getModelRouteWithDefaults(findByIdAndUpdate),
            findOneAndUpdate: getModelRouteWithDefaults(findOneAndUpdate),
            updateMany: getModelRouteWithDefaults(updateMany),
            findByIdAndDelete: getModelRouteWithDefaults(findByIdAndDelete),
            findOneAndDelete: getModelRouteWithDefaults(findOneAndDelete),
            deleteMany: getModelRouteWithDefaults(deleteMany),
            countDocuments: getModelRouteWithDefaults(countDocuments),
            estimatedDocumentCount: getModelRouteWithDefaults(
                estimatedDocumentCount
            ),
            watch: getModelRouteWithDefaults(watch),
        }
        modelsMap[modelOpt.model.modelName] = newModelServiceConfig
    }
    return modelsMap
}

/**
 *
 * @param action
 * @param readRoles
 * @param writeRoles
 * @param routeConfig
 */
export function createRouteMiddlewares(
    action: ActionType,
    readRoles: ReadonlyArray<string> | undefined,
    writeRoles: ReadonlyArray<string> | undefined,
    routeConfig: ModelRouteConfig
): ReadonlyArray<GrpcServerMiddleware<any, any>> {
    const { middleware, checkPermission, roleResolver } = routeConfig
    const allMiddlewares: Array<GrpcServerMiddleware<any, any>> = []
    const forbiddenMessage = `Permission not allowed`
    if (middleware) {
        if (Array.isArray(middleware)) {
            if (middleware.length > 0) {
                allMiddlewares.concat(middleware)
            }
        } else {
            allMiddlewares.push(middleware as GrpcServerMiddleware<any, any>)
        }
    }

    if (checkPermission) {
        // creating new permission resolver middleware
        const prm: GrpcServerMiddleware<any, any> = async function(
            context,
            next
        ) {
            if (roleResolver) {
                try {
                    const role = await roleResolver(context)
                    if (action == ActionType.Read) {
                        let allow = false
                        if (writeRoles) {
                            if (writeRoles.includes(role)) {
                                allow = true
                            }
                        }

                        if (readRoles) {
                            if (readRoles.includes(role)) {
                                allow = true
                            }
                        }

                        if (!allow) {
                            return next(
                                GrpcBoom.permissionDenied(forbiddenMessage)
                            )
                        }
                    } else if (
                        action == ActionType.Create ||
                        action == ActionType.Update ||
                        action == ActionType.Delete
                    ) {
                        if (writeRoles && writeRoles.length > 0) {
                            if (!writeRoles.includes(role)) {
                                return next(
                                    GrpcBoom.permissionDenied(forbiddenMessage)
                                )
                            }
                        } else {
                            return next(
                                GrpcBoom.permissionDenied(forbiddenMessage)
                            )
                        }
                    }
                    return next()
                } catch (error) {
                    return next(error)
                }
            } else {
                return next()
            }
        }

        allMiddlewares.push(prm)
    }

    return allMiddlewares
}

/**
 *
 * @param context
 * @param routeMiddlewares
 */
export function executeRouteMiddlewares(
    context: GrpcServerCallContext<any, any>,
    routeMiddlewares: ReadonlyArray<GrpcServerMiddleware<any, any>>
) {
    function executor(resolve: Function, reject: Function) {
        if (routeMiddlewares.length == 0) {
            resolve()
        } else {
            const middieCompleter: onMiddieComplete = async function(err, ctz) {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            }
            const middie = new Middie(routeMiddlewares, middieCompleter)
            middie.run(context)
        }
    }
    return new Promise(executor)
}

/**
 *
 * @param model
 * @param modelsMap
 */
export function checkModelExist(
    model: string,
    modelsMap: Record<string, ModelServiceConfig>
): GrpcBoom | undefined {
    if (model.length == 0) {
        return GrpcBoom.invalidArgument('Model value required')
    } else if (modelsMap[model] == null) {
        return GrpcBoom.invalidArgument('Model not defined on server')
    }
    return undefined
}

/**
 *
 * @param model
 * @param request
 */
export async function createDocument(
    model: Model<any>,
    request: any
): Promise<any> {
    const payload = await jsonParse(request.payload)
    try {
        const doc = await model.create(payload)
        return doc
    } catch (error) {
        throw GrpcBoom.invalidArgument(error.message)
    }
}

/**
 *
 * @param model
 * @param request
 */
export async function insertManyDocuments(
    model: Model<any>,
    request: any
): Promise<any> {
    const payload = await jsonParse(request.payload)
    try {
        const doc = await model.insertMany(payload)
        return doc
    } catch (error) {
        throw GrpcBoom.invalidArgument(error.message)
    }
}

/**
 *
 * @param model
 * @param request
 */
export function findByIdDocument(
    model: Model<any>,
    request: any
): Promise<any> {
    const q = model.findById(request.id)
    q.select(request.select)
    q.populate(request.populate)

    return q.lean().exec()
}

/**
 *
 * @param model
 * @param request
 */
export function findOneDocument(model: Model<any>, request: any): Promise<any> {
    const q = model.findOne(JSON.parse(request.conditions))

    q.select(request.select)
    q.sort(request.sort)
    q.populate(request.populate)

    if (request.skip > 0) q.skip(request.skip)

    return q.lean().exec()
}

/**
 *
 * @param model
 * @param request
 */
export function findDocuments(model: Model<any>, request: any): Promise<any> {
    const q = model.find(JSON.parse(request.conditions))

    q.select(request.select)
    q.sort(request.sort)
    q.populate(request.populate)

    if (request.skip > 0) q.skip(request.skip)
    if (request.limit > 0) q.limit(request.limit)

    return q.lean().exec()
}

/**
 *
 * @param model
 * @param request
 */
export function findDocumentsAndStreamResponse(
    model: Model<any>,
    request: any
): QueryCursor<any> {
    const q = model.find(JSON.parse(request.conditions))

    q.select(request.select)
    q.sort(request.sort)
    q.populate(request.populate)

    if (request.skip > 0) q.skip(request.skip)
    if (request.limit > 0) q.limit(request.limit)

    return q.lean().cursor()
}

/**
 *
 * @param model
 * @param request
 */
export function findDocumentsLive(
    model: Model<any>,
    request: any
): ChangeStream {
    const conditions = JSON.parse(request.conditions)
    function updateKey(key: string): string {
        if (key != null) {
            if (key.charAt(0) != '$') {
                return `fullDocument.${key}`
            }
        }
        return key
    }

    const updatedConditions = transformObjKeys(conditions, updateKey, {
        deep: true,
    })

    const changeStream = model.collection.watch(
        [
            {
                $match: {
                    $or: [
                        {
                            operationType: { $in: ['insert', 'update'] },
                            ...updatedConditions,
                        },
                        {
                            operationType: { $in: ['delete'] },
                        },
                    ],
                },
            },
        ],
        {
            fullDocument: 'updateLookup',
        }
    )

    return changeStream
}

/**
 *
 * @param model
 * @param request
 */
export function findByIdAndUpdateDocument(
    model: Model<any>,
    request: any
): Promise<any> {
    const q = model.findByIdAndUpdate(request.id, JSON.parse(request.update), {
        new: request.returnNew,
        select: request.select,
        upsert: request.upsert,
    })

    return q.lean().exec()
}

/**
 *
 * @param model
 * @param request
 */
export function findOneAndUpdateDocument(
    model: Model<any>,
    request: any
): Promise<any> {
    // TODO:: there is some issue please take care of it
    const q = model.findOneAndUpdate(request.id, JSON.parse(request.update), {
        new: request.returnNew,
        select: request.select,
        upsert: request.upsert,
        sort: request.sort,
    })

    return q.lean().exec()
}

/**
 *
 * @param model
 * @param request
 */
export function updateManyDocuments(
    model: Model<any>,
    request: any
): Promise<any> {
    const q = model.updateMany(
        JSON.parse(request.conditions),
        JSON.parse(request.update),
        {
            safe: request.safe,
            upsert: request.upsert,
            multi: request.multi,
        }
    )

    return q.lean().exec()
}

/**
 *
 * @param model
 * @param request
 */
export function findByIdAndDeleteDocument(
    model: Model<any>,
    request: any
): Promise<any> {
    const q = model.findByIdAndDelete(request.id, {
        select: request.select,
    })

    return q.lean().exec()
}

/**
 *
 * @param model
 * @param request
 */
export function findOneAndDeleteDocument(
    model: Model<any>,
    request: any
): Promise<any> {
    const q = model.findOneAndDelete(JSON.parse(request.conditions), {
        select: request.select,
        sort: request.sort,
    })

    return q.lean().exec()
}

/**
 *
 * @param model
 * @param request
 */
export function deleteManyDocuments(
    model: Model<any>,
    request: any
): Promise<any> {
    const q = model.deleteMany(JSON.parse(request.conditions))

    return q.lean().exec()
}

/**
 *
 * @param model
 * @param request
 */
export function countDocumentsUtil(
    model: Model<any>,
    request: any
): Promise<any> {
    const q = model.countDocuments(JSON.parse(request.criteria))

    return q.exec()
}

/**
 *
 * @param model
 * @param request
 */
export function estimatedDocumentCountUtil(
    model: Model<any>,
    request: any
): Promise<any> {
    const q = model.estimatedDocumentCount()

    return q.exec()
}

/**
 *
 * @param model
 * @param request
 */
export function watchUtil(model: Model<any>, request: any): ChangeStream {
    const { pipeline, options } = request
    const nOpt: any = {}
    if (options.fullDocument.length > 0)
        nOpt.fullDocument = options.fullDocument
    if (options.maxAwaitTimeMS > 0) nOpt.maxAwaitTimeMS = options.maxAwaitTimeMS
    if (options.resumeAfter.length > 0) nOpt.resumeAfter = options.resumeAfter
    if (options.startAfter.length > 0) nOpt.startAfter = options.startAfter
    if (options.batchSize > 0) nOpt.batchSize = options.batchSize
    if (options.readPreference.length > 0)
        nOpt.readPreference = options.readPreference

    const stream = model.collection.watch(JSON.parse(pipeline), nOpt)
    return stream
}
