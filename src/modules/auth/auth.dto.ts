import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator"

export class SignUpDTO {
    @ApiProperty({ example: 'Nguyen Van A', type: 'string', nullable: false })
    @IsString({ message: 'Họ và tên là chuỗi' })
    @IsNotEmpty({ message: "Vui lòng nhập Họ và tên" })
    @Matches(/^[\p{L}\s]+$/u, { message: "Họ và tên chỉ được chứa chữ cái" })
    @MinLength(10, { message: 'Họ và tên tối thiểu 10 ký tự' })
    @MaxLength(50, { message: 'Họ và tên tối da 50 ký tự' })
    fullname: string

    @ApiProperty({ example: 'nguyenvana@st.hcmuaf.edu.vn', type: 'string', nullable: false })
    @IsString()
    @IsEmail({}, { message: "Email không đúng định dạng" })
    email: string

    @ApiProperty({ example: 'Matkhau@123', type: 'string', nullable: false })
    @IsNotEmpty({ message: 'Vui lòng cung cấp mật khẩu' })
    @IsString({ message: 'Mật khẩu yêu cầu kiểu dữ liệu là chuỗi' })
    @MinLength(8)
    @MaxLength(20)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$/, { message: 'Mật khẩu cần có chữ hoa, chữ thường và số' })
    @Matches(/[@#$%^&*!?]/, { message: 'Mật khẩu chấp nhận các ký tự: @, #, $, %, ^, &, *, !, ?' })
    password: string
}

export class SignInDTO {
    @ApiProperty({ example: 'duytran.290804@gmail.com' })
    @IsNotEmpty({ message: 'Vui lòng cung cấp Email' })
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    email: string

    @ApiProperty({ example: 'Matkhau@123' })
    @IsNotEmpty({ message: 'Vui lòng cung cấp mật khẩu' })
    @IsString({ message: 'Mật khẩu yêu cầu kiểu dữ liệu là chuỗi' })
    password: string
}

export class RequireResetPassword {
    @ApiProperty({ example: 'duytran.290804@gmail.com', nullable: false })
    @IsNotEmpty({ message: 'Vui lòng cung cấp gmail' })
    @IsString({ message: 'Email: Kiểu dữ liệu không phù hợp' })
    @IsEmail({}, { message: "Email không đúng định dạng" })
    email: string
}

export class UpdatePassword {
    @ApiProperty({ example: 'accessToken' })
    @IsNotEmpty({ message: 'Vui lòng cung cấp đầy đủ token' })
    @IsString({ message: 'Token: Kiểu dữ liệu không phù hợp' })
    accessToken: string;

    @ApiProperty({ example: 'refreshToken' })
    @IsNotEmpty({ message: 'Vui lòng cung cấp đầy đủ token' })
    @IsString({ message: 'Token: Kiểu dữ liệu không phù hợp' })
    refreshToken: string;

    @ApiProperty({ example: 'Matkhau@123', type: 'string', nullable: false })
    @IsNotEmpty({ message: 'Vui lòng cung cấp mật khẩu' })
    @IsString({ message: 'Mật khẩu yêu cầu kiểu dữ liệu là chuỗi' })
    @MinLength(8)
    @MaxLength(20)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$/, { message: 'Mật khẩu cần có chữ hoa, chữ thường và số' })
    @Matches(/[@#$%^&*!?]/, { message: 'Mật khẩu chấp nhận các ký tự: @, #, $, %, ^, &, *, !, ?' })
    newPassword: string;
}