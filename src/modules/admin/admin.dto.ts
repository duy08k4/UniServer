import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class getUsersPaginationDTO {
    @ApiProperty({ description: 'Page', default: 1, required: true })
    @IsNotEmpty()
    @IsString()
    page: string
    
    @ApiProperty({ description: 'Amount of item in one page', default: 10, required: true })
    @IsNotEmpty()
    @IsString()
    size: string

    @ApiProperty({ description: "Search: name, email", required: false })
    @IsOptional()
    @IsString()
    search?: string
    
    @ApiProperty({ description: "Filter by banned", required: false })
    @IsOptional()
    @Transform(({ value }) => {
            if (value === 'true' || value === true || value === 1 || value === '1') return true;
            if (value === 'false' || value === false || value === 0 || value === '0') return false;
            return undefined;
        })
    @IsBoolean()
    is_banned?: boolean
    
    @ApiProperty({ description: "Filter by deleted", required: false })
    @IsOptional()
    @Transform(({ value }) => {
            if (value === 'true' || value === true || value === 1 || value === '1') return true;
            if (value === 'false' || value === false || value === 0 || value === '0') return false;
            return undefined;
        })
    @IsBoolean()
    is_deleted?: boolean
}

export class updateUserDTO {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    is_banned?: boolean

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    is_deleted?: boolean
}