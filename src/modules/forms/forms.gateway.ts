import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { isUUID } from 'class-validator'
import { Server } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'forms' })
export class FormsGateway {
    @WebSocketServer()
    server: Server

    toggleStop(data: { formId: string; classId: string; is_stopped: boolean }) {
        if (!isUUID(data.formId) || !isUUID(data.classId)) return
        this.server.emit('toggle-stop', data)
    }

    formSaved(data: { formId: string; classId: string; milestoneId: string | null; isNew: boolean }) {
        if (!isUUID(data.formId) || !isUUID(data.classId)) return
        this.server.emit('form-saved', data)
    }

    formDeleted(data: { formIds: string[]; classId: string }) {
        if (!isUUID(data.classId)) return
        this.server.emit('form-deleted', data)
    }
}
