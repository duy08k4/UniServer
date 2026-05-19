import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"
import { ThesisType } from "src/enums/enums"

export class CreateTopicDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    milestoneId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    title: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string

    @ApiProperty({ enum: ThesisType })
    @IsNotEmpty()
    @IsEnum(ThesisType)
    thesis_type: ThesisType
}

export class InviteSupervisorDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    supervisorId: string
}

export class SupervisorResponseDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty()
    @IsNotEmpty()
    accept: boolean

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    rejection_note?: string
}

export class SubmitOutlineDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    outline_file_url: string
}

export class ReviewTopicDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty()
    @IsNotEmpty()
    approve: boolean

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    rejection_note?: string
}

export class TopicQueryDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    milestoneId?: string
}

export class LecturerTopicQueryDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    milestoneId?: string
}

export class CancelInviteDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string
}

export class AssignReviewerDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    reviewerId: string
}
