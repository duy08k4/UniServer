import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PublicService } from "./public.service";
import { GetThesesDTO } from "./public.dto";

@ApiTags("Public")
@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) {}

    @Get('theses')
    getTheses(@Query() query: GetThesesDTO) {
        return this.publicService.getTheses(query)
    }

    @Get('theses/:id')
    getOneThesis(@Param('id') id: string) {
        return this.publicService.getOneThesis(id)
    }
}
