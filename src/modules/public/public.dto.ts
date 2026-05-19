import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class GetThesesDTO {
    @ApiProperty({ default: 1 })
    @IsNotEmpty()
    @IsString()
    page: string

    @ApiProperty({ default: 10 })
    @IsNotEmpty()
    @IsString()
    size: string

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string

    @ApiProperty({ required: false, enum: ['thesis', 'capstone'] })
    @IsOptional()
    @IsString()
    thesis_type?: string

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    date_from?: string

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    date_to?: string
}
