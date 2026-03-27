import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RoomRole } from "src/enums/enums";

export class ApprovedClassDTO {
    @ApiProperty({ description: 'ID of the class to approve' })
    @IsOptional()
    @IsString()
    classId: string
}

export class GetClassDTO {
    @ApiProperty({ description: 'ID is required if role is user', required: false })
    @IsOptional()
    @IsString()
    userId?: string

    @ApiProperty({ description: 'Page', default: 1 })
    @IsNotEmpty()
    @IsString()
    page: string

    @ApiProperty({ description: 'Amount of class in one page', default: 10 })
    @IsOptional()
    @IsString()
    size?: string

    @ApiProperty({ description: "Search: Class'name, Subject, owner's name, owner's email", required: false})
    @IsOptional()
    @IsString()
    search?: string
}

export class CreateClassDTO {
    @ApiProperty({ example: 'd5105d88-d54c-463f-a24e-52c92921dde2' })
    @IsNotEmpty()
    @IsString()
    userId: string

    @ApiProperty({ description: 'Label of the class', example: 'Lớp Công nghệ phần mềm' })
    @IsNotEmpty()
    @IsString()
    label: string

    @ApiProperty({ description: 'Description of the class', required: false })
    @IsOptional()
    description?: string

    @ApiProperty({ description: 'Subject of the class', example: 'Software Engineering' })
    @IsNotEmpty()
    @IsString()
    subject: string
}

export class UpdateClassDTO {
    @ApiProperty({ required: true })
    @IsString()
    classId: string

    @ApiProperty({ required: true })
    @IsString()
    userId: string

    @ApiProperty({ description: 'Label of the class', required: false })
    @IsOptional()
    @IsString()
    label?: string

    @ApiProperty({ description: 'Description of the class', required: false })
    @IsOptional()
    @IsString()
    description?: string

    @ApiProperty({ description: 'Subject of the class', required: false })
    @IsOptional()
    @IsString()
    subject?: string

    @ApiProperty({ description: 'Whether the class requires approval for creation', required: false })
    @IsOptional()
    @IsBoolean()
    required_approval?: boolean

    @ApiProperty({ description: 'Whether the class requires a join form', required: false })
    @IsOptional()
    @IsBoolean()
    required_join_form?: boolean
}

export class RemoveClassDTO {
    @ApiProperty({ required: true })
    @IsString()
    classId: string

    @ApiProperty({ required: true })
    @IsString()
    userId: string
}

export class JoinClassDTO {
    @ApiProperty({ description: 'UserId', required: true })
    @IsNotEmpty()
    @IsString()
    userId: string

    @ApiProperty({ description: 'Join code of the class', required: true })
    @IsNotEmpty()
    @IsString()
    joinCode: string

    @ApiProperty({ enum: RoomRole, default: RoomRole.STUDENT, required: true })
    @IsOptional()
    @IsString()
    joinRole: RoomRole
}

export class UpdateCommitteeDTO {
    @ApiProperty({ description: 'UserId', required: true })
    @IsNotEmpty()
    @IsString()
    userId: string

    @ApiProperty({ description: 'true => committee, false => not committee', required: true })
    @IsNotEmpty()
    @IsBoolean()
    isCommittee: boolean
}

export class RemoveMemberDTO {
    @ApiProperty({ required: true, description: "ID of the user to remove" })
    @IsNotEmpty()
    @IsString()
    userId: string

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty({ required: false, description: "This param required if the class owner leaves" })
    @IsOptional()
    @IsString()
    newOwnerId?: string
}