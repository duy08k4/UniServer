import { Field_Type, SubmissionStatus } from "@app/enums/enums";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

export class UpdateAnswerDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    id?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    fieldId: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    body?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsEnum(Field_Type)
    input_type: Field_Type
}

export class UpdateAnswerCheckboxDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    id?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    checkboxFieldId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    fieldChoicesId: string
}

export class UpdateSubmissionDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    id?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    formId: string

    @ApiProperty({
        type: [UpdateAnswerDTO]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateAnswerDTO)
    answer: UpdateAnswerDTO[]

    @ApiProperty({
        type: [UpdateAnswerCheckboxDTO]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateAnswerCheckboxDTO)
    answer_checkbox: UpdateAnswerCheckboxDTO[]
}

export class SubmissionPaginationDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    classId?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    formId?: string

    @ApiProperty()
    @IsNumberString()
    page: string

    @ApiProperty()
    @IsNumberString()
    size: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string

    @ApiPropertyOptional({ enum: SubmissionStatus })
    @IsOptional()
    @IsEnum(SubmissionStatus)
    status?: SubmissionStatus
}
