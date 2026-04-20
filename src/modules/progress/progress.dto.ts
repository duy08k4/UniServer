import { ApiProperty } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator"

export class NewProgressDTO {
    @ApiProperty({ description: 'ID of the class', required: true })
    @IsNotEmpty()
    @IsString()
    classId: string
    
    @ApiProperty({ description: 'Label of the class', required: true, example: 'Tên quy trình' })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    label: string

    @ApiProperty({ description: 'Description of the class', required: true, example: 'Mô tả quy trình' })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(300)
    description: string
}

export class ProgressPaginationDTO {
    @ApiProperty({ description: 'page', required: true })
    @IsNotEmpty()
    @IsString()
    page: string

    @ApiProperty({ description: 'Amount of item in one page', required: true })
    @IsNotEmpty()
    @IsString()
    size: string

    @ApiProperty({ description: "Search: name, creator' name, creator's email, class's name, class's subject ", required: false })
    @IsOptional()
    @IsString()
    search?: string

    @ApiProperty({ description: "Filter by approved creation", required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    created_approval?: boolean

    @ApiProperty({ description: "Filter by disabled progress", required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_banned?: boolean

    @ApiProperty({ description: "Filter by soft-deleted progress", required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_deleted?: boolean
}

export class UpdateProgressDTO {
    @ApiProperty({ description: 'Id of the class', required: true })
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty({ description: 'Id of the progress', required: true })
    @IsNotEmpty()
    @IsString()
    progressId: string

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    label?: string

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    is_submitted?: boolean

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_deleted?: boolean // Only system admin

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_banned?: boolean // Only system admin

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    created_approval?: boolean // Only system admin
}



export class MilestoneDTO {
    @ApiProperty({ example: '1' })
    @IsOptional()
    @IsString()
    id?: string; // If milestone has ID, using update

    @ApiProperty({ example: '1' })
    @IsString()
    @IsNotEmpty()
    index: string;

    @ApiProperty({ example: 'Bắt đầu' })
    @IsString()
    @IsNotEmpty()
    label: string;

    @ApiProperty({ example: 'Giai đoạn khởi tạo dự án' })
    @IsString()
    description: string;

    @ApiProperty({ example: false })
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_stopped: boolean
}

export class NewMilestoneDTO {
    @ApiProperty({ example: 'CLASS_001' })
    @IsString()
    @IsNotEmpty()
    classId: string;

    @ApiProperty({ example: 'PROGRESS_ID_123' })
    @IsString()
    @IsNotEmpty()
    progressId: string;

    @ApiProperty({
        type: [MilestoneDTO], // Khai báo mảng Object cho Swagger
        description: 'Danh sách các cột mốc tiến độ'
    })
    @IsArray()
    @ValidateNested({ each: true }) // Validate từng object trong mảng
    @Type(() => MilestoneDTO)       // Cần thiết để class-transformer hiểu kiểu dữ liệu
    milestone: MilestoneDTO[];
}

export class MilestonePaginationDTO {
    @ApiProperty({ description: 'page', required: true })
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty({ description: 'page', required: true })
    @IsNotEmpty()
    @IsString()
    progressId: string

    @ApiProperty({ description: 'page', required: true })
    @IsNotEmpty()
    @IsString()
    page: string

    @ApiProperty({ description: 'Amount of item in one page', required: true })
    @IsNotEmpty()
    @IsString()
    size: string

    @ApiProperty({ description: "Search: name's milestone, name's progress(only system admin) ", required: false })
    @IsOptional()
    @IsString()
    search?: string

    @ApiProperty({ description: "Filter by deleted creation", required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_deleted?: boolean

    @ApiProperty({ description: "Filter by stopped progress", required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 1 || value === '1') return true;
        if (value === 'false' || value === false || value === 0 || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    is_stopped?: boolean

}