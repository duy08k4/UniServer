import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'
import { RoomRole } from 'src/enums/enums'

@WebSocketGateway({
    cors: { origin: '*' }
})
export class GlobalGateway {
    @WebSocketServer()
    server: Server

    // Room admin approve a member
    approveMember(data: { memberId: string, role: RoomRole, classId: string, result: boolean }) {
        this.server.emit('approve-member', data)
    }

    // One user join class if the class require approval
    joinClass(data: { classId: string, newMemberId: string, newMemberName: string, newMemberEmail: string }) {
        this.server.emit('new-member', data)
    }

    // A class is created
    createNewClass(data: { classId: string }) {
        this.server.emit('new-class', data)
    }

    // Update class's status in two actions: approve class, ban a class
    updateClassStatus(data: { classId: string, approvalClass?: boolean, banned?: boolean }) {
        this.server.emit('update-class-status', data)
    }

    // Force logout a user (ban or delete)
    forceLogout(data: { userId: string, reason: 'banned' | 'deleted' }) {
        this.server.emit('force-logout', data)
    }
}