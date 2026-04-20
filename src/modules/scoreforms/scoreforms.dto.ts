import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import { IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf, ValidateNested } from "class-validator"
import { ScoreForm_Type } from "src/enums/enums"

export class ScoreFormsPaginationDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
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

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_deleted?: boolean

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_stopped?: boolean
}

export class UpdateScoreFormColumnDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    id?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    label: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    formula_content?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    index?: string
}

export class UpdateScoreFormRowDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    id?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    index: string
}

export class UpdateScoreFormDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    classId: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    id?: string

    @ApiProperty({ default: ScoreForm_Type.OTHERS })
    @IsNotEmpty()
    @IsEnum(ScoreForm_Type)
    score_form_type: ScoreForm_Type

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    label: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    field_count: string

    @ApiProperty()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_auto_open: boolean

    @ApiProperty()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_auto_close: boolean

    @ApiProperty()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_deleted: boolean

    @ApiProperty()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_stopped: boolean

    @ApiPropertyOptional()
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    open_at: Date

    @ApiPropertyOptional()
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    close_at: Date

    @ApiProperty({ type: [UpdateScoreFormColumnDTO] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateScoreFormColumnDTO)
    columns: UpdateScoreFormColumnDTO[]
}

export class RemoveScoreFormsDTO {
    @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'] })
    @IsArray()
    @IsUUID('all', { each: true })
    ids: string[]
}