import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { isUUID } from 'class-validator'
import { Server } from 'socket.io'

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: "notification"
})
export class NotificationGateway {
    @WebSocketServer()
    server: Server

    updateNotification(data: { notificationId: string, classId: string }) {
        const { notificationId, classId } = data

        if (!isUUID(notificationId) || !isUUID(classId)) return
        this.server.emit("update-notification", data)
    }

    removeNotification(data: { notificationId: string, classId: string }) {
        const { notificationId, classId } = data

        if (!isUUID(notificationId) || !isUUID(classId)) return
        this.server.emit("remove-notification", data)
    }
}