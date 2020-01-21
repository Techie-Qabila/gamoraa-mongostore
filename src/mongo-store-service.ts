import path from 'path'
import { pipeline } from 'stream'
import Server from 'gamoraa'
import GrpcBoom from 'grpc-boom'
import { ActionType, MongoStoreServiceConfig } from './types'
import {
    createModelsMap,
    checkModelExist,
    createRouteMiddlewares,
    executeRouteMiddlewares,
    createDocument,
    insertManyDocuments,
    findByIdDocument,
    findOneDocument,
    findDocuments,
    findDocumentsLive,
    findDocumentsAndStreamResponse,
    findByIdAndUpdateDocument,
    findOneAndUpdateDocument,
    updateManyDocuments,
    findByIdAndDeleteDocument,
    findOneAndDeleteDocument,
    deleteManyDocuments,
    countDocumentsUtil,
    estimatedDocumentCountUtil,
    watchUtil,
} from './utils/service-utils'
import {
    transformResponse,
    ChangeStreamToFindRecordsTransform,
} from './utils/transform-utils'

export {
    ModelRouteConfig,
    ModelServiceConfig,
    MongoStoreServiceConfig,
    roleResolveHandler,
} from './types'

/**
 *
 */
const FIRESTORE_PROTO_PATH = path.join(
    __dirname,
    '../../proto/mongo_store.proto'
)

export default async function mongoStoreService(
    server: Server,
    config: MongoStoreServiceConfig,
    done: (err?: Error) => void
) {
    const modelsMap = createModelsMap(config.modelsOptions || [])
    const serviceContext = server.addService(
        FIRESTORE_PROTO_PATH,
        'MongoStoreService',
        {
            /**
             *
             * @param context
             */
            create: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }
                //
                const { model, create, readRoles, writeRoles } = modelsMap[
                    colName
                ]
                if (create?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Create,
                    readRoles,
                    writeRoles,
                    create!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await createDocument(model, context.request)
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            insertMany: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const { model, insertMany, readRoles, writeRoles } = modelsMap[
                    colName
                ]
                if (insertMany?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Create,
                    readRoles,
                    writeRoles,
                    insertMany!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await insertManyDocuments(
                        model,
                        context.request
                    )
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            findById: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const { model, findById, readRoles, writeRoles } = modelsMap[
                    colName
                ]
                if (findById?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Read,
                    readRoles,
                    writeRoles,
                    findById!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await findByIdDocument(model, context.request)
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            findOne: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const { model, findOne, readRoles, writeRoles } = modelsMap[
                    colName
                ]
                if (findOne?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Read,
                    readRoles,
                    writeRoles,
                    findOne!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await findOneDocument(model, context.request)
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            find: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const { model, find, readRoles, writeRoles } = modelsMap[
                    colName
                ]
                if (find?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Read,
                    readRoles,
                    writeRoles,
                    find!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await findDocuments(model, context.request)
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            findAndStreamResponse: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const {
                    model,
                    findAndStreamResponse,
                    readRoles,
                    writeRoles,
                } = modelsMap[colName]
                if (findAndStreamResponse?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Read,
                    readRoles,
                    writeRoles,
                    findAndStreamResponse!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const cursor = findDocumentsAndStreamResponse(
                        model,
                        context.request
                    ).map(transformResponse)
                    pipeline(cursor, context.call as any, err => {})
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            findLive: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const { model, findLive, readRoles, writeRoles } = modelsMap[
                    colName
                ]
                if (findLive?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Read,
                    readRoles,
                    writeRoles,
                    findLive!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await findDocuments(model, context.request)
                    context.write({ data: JSON.stringify(doc) })

                    const changeStream = findDocumentsLive(
                        model,
                        context.request
                    )
                    pipeline(
                        changeStream as any,
                        new ChangeStreamToFindRecordsTransform(
                            model,
                            context.request
                        ),
                        context.call as any,
                        err => {}
                    )
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            findByIdAndUpdate: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const {
                    model,
                    findByIdAndUpdate,
                    readRoles,
                    writeRoles,
                } = modelsMap[colName]
                if (findByIdAndUpdate?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Update,
                    readRoles,
                    writeRoles,
                    findByIdAndUpdate!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await findByIdAndUpdateDocument(
                        model,
                        context.request
                    )
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            findOneAndUpdate: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const {
                    model,
                    findOneAndUpdate,
                    readRoles,
                    writeRoles,
                } = modelsMap[colName]
                if (findOneAndUpdate?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Update,
                    readRoles,
                    writeRoles,
                    findOneAndUpdate!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await findOneAndUpdateDocument(
                        model,
                        context.request
                    )
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            updateMany: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const { model, updateMany, readRoles, writeRoles } = modelsMap[
                    colName
                ]
                if (updateMany?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Update,
                    readRoles,
                    writeRoles,
                    updateMany!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await updateManyDocuments(
                        model,
                        context.request
                    )
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            findByIdAndDelete: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const {
                    model,
                    findByIdAndDelete,
                    readRoles,
                    writeRoles,
                } = modelsMap[colName]
                if (findByIdAndDelete?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Delete,
                    readRoles,
                    writeRoles,
                    findByIdAndDelete!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await findByIdAndDeleteDocument(
                        model,
                        context.request
                    )
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            findOneAndDelete: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const {
                    model,
                    findOneAndDelete,
                    readRoles,
                    writeRoles,
                } = modelsMap[colName]
                if (findOneAndDelete?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Delete,
                    readRoles,
                    writeRoles,
                    findOneAndDelete!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await findOneAndDeleteDocument(
                        model,
                        context.request
                    )
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            deleteMany: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const { model, deleteMany, readRoles, writeRoles } = modelsMap[
                    colName
                ]
                if (deleteMany?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Delete,
                    readRoles,
                    writeRoles,
                    deleteMany!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const doc = await deleteManyDocuments(
                        model,
                        context.request
                    )
                    context.send({ data: JSON.stringify(doc) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            countDocuments: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const {
                    model,
                    countDocuments,
                    readRoles,
                    writeRoles,
                } = modelsMap[colName]
                if (countDocuments?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Read,
                    readRoles,
                    writeRoles,
                    countDocuments!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const count = await countDocumentsUtil(
                        model,
                        context.request
                    )
                    context.send({ data: JSON.stringify(count) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            estimatedDocumentCount: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const {
                    model,
                    estimatedDocumentCount,
                    readRoles,
                    writeRoles,
                } = modelsMap[colName]
                if (estimatedDocumentCount?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Read,
                    readRoles,
                    writeRoles,
                    estimatedDocumentCount!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const count = await estimatedDocumentCountUtil(
                        model,
                        context.request
                    )
                    context.send({ data: JSON.stringify(count) })
                } catch (error) {
                    context.halt(error)
                }
            },
            /**
             *
             * @param context
             */
            watch: async function(context) {
                const colName = context.request.collection
                const err = checkModelExist(colName, modelsMap)
                if (err) {
                    return context.halt(err)
                }

                const { model, watch, readRoles, writeRoles } = modelsMap[
                    colName
                ]
                if (watch?.disable) {
                    return context.halt(GrpcBoom.notFound('Not found'))
                }

                const routeMiddlewares = createRouteMiddlewares(
                    ActionType.Read,
                    readRoles,
                    writeRoles,
                    watch!
                )

                try {
                    await executeRouteMiddlewares(context, routeMiddlewares)
                    const readStream = watchUtil(
                        model,
                        context.request
                    ).stream({ transform: transformResponse })
                    pipeline(readStream as any, context.call as any, err => {})
                } catch (error) {
                    context.halt(error)
                }
            },
        }
    )

    if (config.middleware) {
        serviceContext.with(config.middleware)
    }

    done()
}
