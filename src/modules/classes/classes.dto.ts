import { IsNotEmpty, IsString } from "class-validator";

export class ApproveClassDTO {
    @IsNotEmpty()
    @IsString()
    classId: string
}