import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import { Equals, IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, Validate, ValidateIf, ValidateNested } from "class-validator"
import { Field_Label, Field_Type, Unit } from "src/enums/enums"

export class FormsPaginationDTO {
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

export class FormField {
    @ApiProperty()
    @IsOptional()
    @IsString()
    fieldId?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    index: string

    @ApiProperty({ example: Field_Label.NULL })
    @IsNotEmpty()
    @IsEnum(Field_Label)
    label: Field_Label

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    title: string

    @ApiProperty()
    @IsOptional()
    @IsString()
    description?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsEnum(Field_Type)
    input_type: Field_Type

    @ApiProperty()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_required: boolean

    @ApiProperty({ example: Unit.CHARACTER })
    @IsNotEmpty()
    @IsEnum(Unit)
    unit: Unit

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    max_attempts: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    min_attempts: string
}

export class FormCheckBoxFieldChoice {
    @ApiProperty()
    @IsOptional()
    @IsString()
    choiceId?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    index: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    body: string
}

export class FormCheckboxField {
    @ApiProperty()
    @IsOptional()
    @IsString()
    checkboxFieldId?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    index: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    title: string

    @ApiProperty()
    @IsOptional()
    @IsString()
    description?: string

    @ApiProperty({ example: Field_Type.CHECKBOX })
    @IsNotEmpty()
    @Equals(Field_Type.CHECKBOX)
    input_type: Field_Type.CHECKBOX

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    choice_count: string

    @ApiProperty()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_required: boolean

    @ApiProperty()
    @IsNotEmpty()
    @IsBoolean()
    is_multiple: true

    @ApiProperty({
        type: [FormCheckBoxFieldChoice]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FormCheckBoxFieldChoice)
    checkbox_field_choices: FormCheckBoxFieldChoice[]
}

export class NewFormDTO {
    @ApiProperty({ description: "The class's id" })
    @IsNotEmpty()
    @IsString()
    classId: string

    // Nếu milestoneId và notificationId cùng đồng thời tồn tại thì cả milestone và notification đều thuộc lớp có classId
    @ApiProperty({ description: "The milestone's id" })
    @IsOptional()
    @IsString()
    milestoneId?: string // Nếu có thì liên kết form này với milestone thông qua milestoneId

    @ApiProperty({ description: "The milestone's id" })
    @IsOptional()
    @IsString()
    notificationId?: string // Nếu có thì liên kết form này với notification thông qua notificationId

    @ApiProperty()
    @IsOptional()
    @IsString()
    formId?: string

    @ApiProperty({ description: "The form's name" })
    @IsNotEmpty()
    @IsString()
    label: string

    @ApiProperty({ description: "Sign the form is required for new member" })
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_join_form: boolean

    @ApiProperty({ description: "The form's description" })
    @IsOptional()
    @IsString()
    description?: string

    @ApiProperty({ description: "The amount of field" })
    @IsNotEmpty()
    @IsString()
    field_count: string

    @ApiProperty({ description: "Open the form base on open_at" })
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_auto_open: boolean

    @ApiProperty({ description: "Close the form base on close_at" })
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_auto_close: boolean

    @ApiPropertyOptional({ example: null, description: "Time to open form automatically" })
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    open_at?: Date | null

    @ApiPropertyOptional({ example: null, description: "Time to close form automatically" })
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    close_at?: Date | null

    @ApiProperty({
        type: [FormField]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FormField)
    fields: FormField[]

    @ApiProperty({
        type: [FormCheckboxField]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FormCheckboxField)
    checkboxFields: FormCheckboxField[]
}

export class GetFormDetailDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    formId: string
}

export class ToggleStopDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    formId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string
}
