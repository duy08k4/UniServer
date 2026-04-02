import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { log } from 'console'
import { Server } from 'socket.io'

@WebSocketGateway({
    cors: { origin: '*' }
})
export class GlobalGateway {
    @WebSocketServer()
    server: Server

    // Room admin approve a member
    approveMember(data: { receiver: string, classId: string, result: boolean }) {
        const { classId, receiver, result } = data

        if (!classId || !receiver || !result) return

        this.server.emit('approve-member', data)
    }

    // One user join class if the class require approval
    joinClass(data: { receiverEmail: string, classId: string, newMemberId: string, newMemberName: string, newMemberEmail: string }) {
        const { classId, newMemberId, receiverEmail, newMemberEmail, newMemberName  } = data
        if (!classId || !newMemberId || !receiverEmail || !newMemberEmail || !newMemberName) return
        this.server.emit('new-member', data)
    }
}