import GrpcBoom, { Status } from 'grpc-boom'

export function jsonParse(payload: string): Promise<any> {
    try {
        return JSON.parse(payload)
    } catch (error) {
        throw GrpcBoom.invalidArgument('Failed to parse payload')
    }
}
