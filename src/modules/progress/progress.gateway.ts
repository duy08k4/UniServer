import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { isUUID } from 'class-validator'
import { Server } from 'socket.io'

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: "progress"
})
export class ProgressGateway {
    @WebSocketServer()
    server: Server

    updateProgress(data: { classId: string }) {
        const { classId } = data

        if (!isUUID(classId)) return
        this.server.emit('update-progress', data)
    }

}