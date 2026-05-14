import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Keep Alive')
@Controller('keep-alive')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('render')
  @ApiOperation({ summary: 'Keep Render server alive' })
  keepRenderAlive() {
    return {
      status: 'success',
      message: 'Render server is active',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('supabase')
  @ApiOperation({ summary: 'Keep Supabase database alive' })
  async keepSupabaseAlive() {
    return await this.appService.pingDatabase();
  }
}
