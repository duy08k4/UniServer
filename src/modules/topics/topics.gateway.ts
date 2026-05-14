import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { isUUID } from 'class-validator'
import { Server } from 'socket.io'

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: "topics"
})
export class TopicsGateway {
    @WebSocketServer()
    server: Server

    topicUpdated(data: { topicId: string, classId: string }) {
        const { topicId, classId } = data
        if (!isUUID(topicId) || !isUUID(classId)) return
        this.server.emit('topic-updated', data)
    }
}
