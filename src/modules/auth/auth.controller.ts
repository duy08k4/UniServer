import { BadRequestException, Body, Controller, Get, Post, Res } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

// Dto
import { RequireResetPassword, SignInDTO, SignUpDTO, UpdatePassword } from "./auth.dto";
import { AuthService } from "./auth.service";
import type { Response } from "express";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }


    // Sign up
    @Post('signup')
    @ApiOperation({ summary: '(Public)' })
    @ApiResponse({
        status: 201,
        description: 'User registration successful',
        schema: {
            example: {
                message: "Registration successful!",
                data: {
                    id: "b7d9c8a2-1a2f-4c45-9c0b-6bfa1b7a3e1d",
                    email: "nguyenvana@gmail.com",
                    full_name: "Nguyen Van A"
                }
            }
        }
    })

    @ApiResponse({
        status: 400,
        description: "Invalid input data",
        schema: {
            example: {
                statusCode: 400,
                message: "Email không đúng định dạng",
                error: "Bad Request"
            }
        }
    })

    @ApiResponse({
        status: 409,
        description: 'User already exists',
        schema: {
            example: {
                statusCode: 409,
                message: "User has already exist",
                error: "Conflict"
            }
        }
    })

    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        schema: {
            example: {
                statusCode: 500,
                message: "Internal server error"
            }
        }
    })
    async signUp(@Body() signupDto: SignUpDTO) {
        return this.authService.signUp(signupDto)
    }


    // Sign in
    @Post('signin')
    @ApiResponse({
        status: 201,
        description: 'Login successful',
        schema: {
            example: {
                message: "Login successful",
                data: {
                    id: "1cf45c67-4c3c-4b27-a375-63aa85fe2egf",
                    supabase_id: "58fdd8c9-7374-4471-9fe3-0c7a1d1bfg5b",
                    full_name: "Nguyen Van A",
                    email: "nguyenvana@gmail.com",
                    is_banned: false,
                    is_deleted: false,
                    role: "user",
                    phone_number: null,
                    created_at: "2026-03-16T05:42:03.424Z",
                    updated_at: "2026-03-16T05:42:03.424Z"
                }
            }
        }
    })

    @ApiResponse({
        status: 400,
        description: 'Invalid email or password',
        schema: {
            example: {
                statusCode: 400,
                message: "Invalid login credentials"
            }
        }
    })

    @ApiResponse({
        status: 403,
        description: 'Account banned or deleted',
        schema: {
            example: {
                statusCode: 403,
                message: "This account is no longer available"
            }
        }
    })

    @ApiResponse({
        status: 409,
        description: 'User exists in auth but not in database',
        schema: {
            example: {
                statusCode: 409,
                message: "User logined but data does not exist"
            }
        }
    })
    async signIn(
        @Body() signDto: SignInDTO,
        @Res({ passthrough: true }) res: Response
    ) {
        const response = await this.authService.signIn(signDto)
        res.cookie(
            'access_token',
            response.token.access_token,
            {
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                maxAge: response.token.expires_in * 1000
            }
        )

        res.cookie(
            'refresh_token',
            response.token.refresh_token,
            {
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                maxAge: (response.token.expires_in + 86400) * 1000 // Thời gian của accessToken + 1 ngày
            }
        )
        return response.response
    }


    // Signout
    @Get('signout')
    @ApiResponse({
        status: 200,
        description: 'Logout successful',
        schema: {
            example: {
                message: "Logout successful!",
                data: {}
            }
        }
    })

    @ApiResponse({
        status: 400,
        description: 'Logout failed',
        schema: {
            example: {
                statusCode: 400,
                message: "Logout failed"
            }
        }
    })
    async signOut(
        @Res({ passthrough: true }) res: Response
    ) {
        const response = await this.authService.signOut()
        if (response) {
            res.clearCookie('access_token')
            res.clearCookie('refresh_token')
            return {
                message: 'Logout successful!',
                data: {}
            }

        } else {
            throw new BadRequestException('Logout failed')
        }

    }


    // Require reset password
    @Post('password/require-reset')
    @ApiResponse({
        status: 200,
        description: 'Send reset password email successfully',
        schema: {
            example: true,
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request',
        schema: {
            example: {
                statusCode: 400,
                message: 'Invalid email or request',
                error: 'Bad Request',
            },
        },
    })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Something went wrong',
                error: 'Internal Server Error',
            },
        },
    })
    async requireResetPassword(@Body() requireResetPassword: RequireResetPassword) {
        return this.authService.requieResetPassword(requireResetPassword)
    }


    // Update password
    @Post('password/update')
    async updatePassword(@Body() updatePassword: UpdatePassword) {
        return this.authService.updatePassword(updatePassword)
    }
}