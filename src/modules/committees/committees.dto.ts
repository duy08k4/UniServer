import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsString, ValidateNested } from "class-validator"
import { CommitteeRole } from "src/enums/enums"

export class CommitteeMemberDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    userId: string

    @ApiProperty({ enum: CommitteeRole })
    @IsNotEmpty()
    @IsEnum(CommitteeRole)
    role: CommitteeRole
}

export class UpsertCommitteeDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    classId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    milestoneId: string

    @ApiProperty({ type: [CommitteeMemberDTO] })
    @IsArray()
    @ArrayMinSize(3)
    @ValidateNested({ each: true })
    @Type(() => CommitteeMemberDTO)
    members: CommitteeMemberDTO[]
}
