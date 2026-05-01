import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Role, RoomRole } from 'src/enums/enums'

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: "class"
})
export class ClassGateway {
    @WebSocketServer()
    server: Server

    removeMember(data: { memberId: string, classId: string }) {
        this.server.emit("remove-user-from-class", data)
    }
    
    suspendMember(data: { memberId: string, classId: string, result: boolean }) {
        this.server.emit("suspend-user-from-class", data)
    }

    updateMemberData(data: { memberId: string, classId: string, role: RoomRole }) {
        /* 
            Why is the input parameter only 'role'?
            - The client browser does not store any member data until the member page is accessed
            - In a class, the user have three roles: roomadmin, student, lecturer. Each role has a private layout. 
            If the role change, I will change the layout and the class data is going to refresh automatically.
        */
        this.server.emit("update-member-data", data)
    }

    leaveTheClass (data: { userId: string, classId: string, role: RoomRole, removeByRole: Role | RoomRole, roomadmin_approved: boolean, newOwnerId?: string }) {
        this.server.emit("leave-class", data)
    }

    dissolveClass (data: { classId: string, removeByRole: Role | RoomRole }) {
        this.server.emit("dissolve-class", data)
    }

    removeClass (data: { classId: string }) {
        this.server.emit("remove-class", data)
    }
}