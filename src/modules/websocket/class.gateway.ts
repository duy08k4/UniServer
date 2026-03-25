import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

@WebSocketGateway({
    cors: true
})
export class ClassGateway {
    @WebSocketServer()
  server: Server

    @SubscribeMessage('test')
    async testSocket(@MessageBody() data: string) {
        console.log(data)
        return "Server trả lời"
    }
}