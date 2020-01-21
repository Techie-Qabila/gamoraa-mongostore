import { Transform, TransformCallback } from 'stream'
import { Model } from 'mongoose'
import { findDocuments } from './service-utils'

export function transformResponse(doc: any) {
    return { data: JSON.stringify(doc) }
}

export class ChangeStreamToFindRecordsTransform extends Transform {
    private readonly model: Model<any>
    private readonly request: any
    constructor(model: Model<any>, request: any) {
        super({
            readableObjectMode: true,
            writableObjectMode: true,
        })
        this.model = model
        this.request = request
    }
    //
    _transform(
        chunk: any,
        encoding: string,
        callback: TransformCallback
    ): void {
        findDocuments(this.model, this.request).then(
            docs => callback(null, { data: JSON.stringify(docs) }),
            err => callback(err, null)
        )
    }
}
