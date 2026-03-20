import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator"

export class SignUpDTO {
    @ApiProperty({ example: 'Nguyen Van A', type: 'string', nullable: false })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[\p{L}\s]+$/u)
    @MinLength(10)
    @MaxLength(50)
    fullname: string

    @ApiProperty({ example: 'nguyenvana@st.hcmuaf.edu.vn', type: 'string', nullable: false })
    @IsString()
    @IsEmail()
    email: string

    @ApiProperty({ example: 'Matkhau@123', type: 'string', nullable: false })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$/)
    @Matches(/[@#$%^&*!?]/)
    password: string
}

export class SignInDTO {
    @ApiProperty({ example: 'duytran.290804@gmail.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string

    @ApiProperty({ example: 'Matkhau@123' })
    @IsNotEmpty()
    @IsString()
    password: string
}

export class RequireResetPassword {
    @ApiProperty({ example: 'duytran.290804@gmail.com', nullable: false })
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string
}

export class UpdatePassword {
    @ApiProperty({ example: 'accessToken' })
    @IsNotEmpty()
    @IsString()
    accessToken: string;

    @ApiProperty({ example: 'refreshToken' })
    @IsNotEmpty()
    @IsString()
    refreshToken: string;

    @ApiProperty({ example: 'Matkhau@123', type: 'string', nullable: false })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$/)
    @Matches(/[@#$%^&*!?]/)
    newPassword: string;
}