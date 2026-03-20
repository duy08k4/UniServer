import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

// Enum
import { PriorityCase, Role } from 'src/enums/enums';

export class GetUseCaseQueryDTO {
    @ApiProperty({ example: null, nullable: true, required: false })
    @IsOptional()
    @IsString()
    usecaseID?: string;
}

export class AddUseCaseDTO {
    @ApiProperty({ example: 'Action', required: true })
    @IsNotEmpty()
    @IsString()
    module: string
    
    @ApiProperty({ example: 'ACT_CN', required: true })
    @IsNotEmpty()
    @IsString()
    uc_name: string
    
    @ApiProperty({ example: 'Hành động mới', required: true })
    @IsNotEmpty()
    @IsString()
    description: string
    
    @ApiProperty({ example: PriorityCase.M_HAVE, required: true })
    @IsNotEmpty()
    @IsString()
    priority: PriorityCase
}

export class UpdateUseCaseDTO {
    @ApiProperty({ example: '84b5ae6a-837b-4cc0-a158-9dbf2b86e8e6', required: true })
    @IsNotEmpty()
    @IsUUID()
    id: string

    @ApiProperty({ example: 'Action', required: false })
    @IsOptional()
    @IsString()
    module?: string
    
    @ApiProperty({ example: 'ACT_CN', required: false })
    @IsOptional()
    @IsString()
    uc_name?: string
    
    @ApiProperty({ example: 'Hành động mới', required: false })
    @IsOptional()
    @IsString()
    description?: string
    
    @ApiProperty({ example: PriorityCase.M_HAVE, required: false })
    @IsOptional()
    @IsEnum(PriorityCase)
    priority?: PriorityCase
}

export class RemoveUseCaseDTO {
    @ApiProperty({ example: '84b5ae6a-837b-4cc0-a158-9dbf2b86e8e6', required: true })
    @IsNotEmpty()
    @IsUUID()
    id: string
}

export class GetPermissionQueryDTO {
    @ApiProperty({ example: null, nullable: true, required: false })
    @IsOptional()
    @IsUUID()
    usecaseID?: string;

    @ApiProperty({ example: Role.USER, required: false })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}

export class UpdatePermissionDTO {
    @ApiProperty({ example: '84b5ae6a-837b-4cc0-a158-9dbf2b86e8e6', required: true })
    @IsNotEmpty()
    @IsUUID()
    id: string

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    can_view?: boolean

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    can_create?: boolean

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    can_edit?: boolean

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    can_delete?: boolean

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    can_approve?: boolean
}

export class AddPermissionDTO {
    @ApiProperty({ example: '84b5ae6a-837b-4cc0-a158-9dbf2b86e8e6', required: true })
    @IsNotEmpty()
    @IsUUID()
    usecase_id: string

    @ApiProperty({ example: Role.USER, required: true })
    @IsNotEmpty()
    @IsEnum(Role)
    role: Role

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    can_view?: boolean

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    can_create?: boolean

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    can_edit?: boolean

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    can_delete?: boolean

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    can_approve?: boolean
}