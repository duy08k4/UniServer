import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class NotificationsPaginationDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    classId?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    page: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    size: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string
}

export class UpdateNotificationDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    id?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    title: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    body: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    milestoneId?: string

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    formIds?: string[]
    }