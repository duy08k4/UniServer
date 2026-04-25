import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: "scoreforms"
})
export class ScoreFormsGateway {
  @WebSocketServer()
  server: Server;

  toggleStop(scoreFormId: string, is_stopped: boolean) {
    this.server.emit('toggle-stop', { scoreFormId, is_stopped });
  }

  scoreFormSaved(scoreFormId: string) {
    this.server.emit('score-form-saved', { scoreFormId });
  }

  scoreFormDeleted(scoreFormIds: string[]) {
    this.server.emit('score-form-deleted', { scoreFormIds });
  }

  cellUpdated(scoreFormId: string, cell: any) {
    this.server.emit('cell-updated', { scoreFormId, cell });
  }
}
