const { ReplSet } = require('mongodb-topology-manager')
const { Schema, Types } = require('mongoose')
import mongoose from 'mongoose'
import Server from 'gamoraa'

import mongoStoreService from '../src/mongo-store-service'

const authorSchema = new Schema({
    name: { type: String, required: true },
    age: { type: Number, required: false },
    stories: [{ type: Schema.ObjectId, ref: 'storeis' }],
})

const storySchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: false },
    rating: { type: Number, required: true },
    creator: { type: Types.ObjectId, ref: 'authors' },
})

/**
 *
 */
async function startServer() {
    console.log(new Date(), `mongoose version: ${mongoose.version}`)
    await setupReplicaSet()
    const uri =
        'mongodb://localhost:31000,localhost:31001,localhost:31002/test_db?replicaSet=rs0'
    const conn = await createDatabaseConnection(uri)
    const authorModel = conn.model('authors', authorSchema)
    const storyModel = conn.model('storeis', storySchema)

    const server = new Server({
        address: '0.0.0.0',
        port: 50051,
    })

    server.register(mongoStoreService, {
        connection: conn,
        modelsOptions: [
            {
                model: authorModel,
            },
            {
                model: storyModel,
            },
        ],
    })

    server.startInsecure()
}

/**
 *
 * @param uri
 */
async function createDatabaseConnection(
    uri: string
): Promise<mongoose.Connection> {
    try {
        const conn = await mongoose.createConnection(uri, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            poolSize: 7,
            useFindAndModify: false,
        })
        return conn
    } catch (error) {
        console.log(error)

        throw error
    }
}

/**
 *
 */
async function setupReplicaSet() {
    const bind_ip = 'localhost'
    // Starts a 3-node replica set on ports 31000, 31001, 31002, replica set
    // name is "rs0".
    const replSet = new ReplSet(
        'mongod',
        [
            {
                options: {
                    port: 31000,
                    dbpath: `${__dirname}/../../data/db/31000`,
                    bind_ip,
                },
            },
            {
                options: {
                    port: 31001,
                    dbpath: `${__dirname}/../../data/db/31001`,
                    bind_ip,
                },
            },
            {
                options: {
                    port: 31002,
                    dbpath: `${__dirname}/../../data/db/31002`,
                    bind_ip,
                },
            },
        ],
        { replSet: 'rs0' }
    )

    // Initialize the replica set
    await replSet.purge()
    await replSet.stop()
    await replSet.start()
    console.log(new Date(), 'Replica set started...')
}

startServer()
    .then(_ => console.log('started'))
    .catch(err => console.log(err))
