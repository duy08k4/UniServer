import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { createClient, Session, SupabaseClient, UserResponse } from "@supabase/supabase-js";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";

// Dto
import { RequireResetPassword, SignInDTO, SignUpDTO, UpdatePassword } from "./auth.dto";
import { Users } from "src/entities/user.en";

@Injectable()
export class AuthService {
    private supabase: SupabaseClient

    constructor(
        private configService: ConfigService,
        @InjectRepository(Users)
        private usersRepository: Repository<Users>,
    ) {
        const supabaseURL = this.configService.get('SUPABASE_URL')
        const supabaseKEY = this.configService.get('SUPABASE_ANON_KEY')
        this.supabase = createClient(supabaseURL, supabaseKEY)
    }

    // Auth me
    async authMe(query: { isUserData: boolean }, req: | any) {
        try {
            const userEmail = req.user.data.user.email

            if (!query.isUserData) return true

            const user = await this.usersRepository.findOne({ where: { email: userEmail } })

            if (!user) throw new ConflictException("User data is missing")

            return user

        } catch (error) {
            console.error(error)
            throw new UnauthorizedException("Unauthorized")
        }
    }

    // Signup
    async signUp(signUpData: SignUpDTO) {
        try {
            const { fullname, email, password } = signUpData

            // Check user's existance
            const userExistance = await this.checkUserExistance(email)

            if (userExistance) {
                throw new ConflictException("User has already exist")
            }

            // Sign up
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password
            })

            if (error) {
                if (error.status === 409) throw new ConflictException(error.message)
                throw new BadRequestException(error.message)
            }

            const user = this.usersRepository.create({
                supabase_id: data.user?.id,
                email,
                full_name: fullname
            })

            const dbuser = await this.usersRepository.save(user)

            return {
                message: 'Registration successful!',
                data: {}
            }
        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    // Signin

    async signIn(signInDto: SignInDTO): Promise<{ token: Session, response: {} }> {
        try {
            const { email, password } = signInDto


            const { data, error } = await this.supabase.auth.signInWithPassword({ email, password })

            if (error) {
                throw new BadRequestException(error.message)
            }

            const userExistance = await this.checkUserExistance(email)
            if (!userExistance) throw new ConflictException('User logined but data does not exist')

            if (userExistance.is_banned || userExistance.is_deleted) throw new ForbiddenException('This account is no longer available')

            return {
                token: data.session,
                response: {
                    message: 'Login successful',
                    data: userExistance
                }
            }


        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }


    // Sign out
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut()
            if (error) return false

            return true
        } catch (error) {
            return false
        }
    }

    // Require reset password
    async requieResetPassword(requireResetPassword: RequireResetPassword) {
        try {
            const { email } = requireResetPassword

            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: this.configService.get<string>('CLIENT_DOMAIN') + "/auth/reset-password"
            })

            if (error) {
                throw error
            }

            return true
        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    // Update password
    async updatePassword(updatePassword: UpdatePassword) {
        try {
            const { accessToken, refreshToken, newPassword } = updatePassword

            const { error: sessionError } = await this.supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            })

            if (sessionError) {
                throw new UnauthorizedException('Invalid or expired reset token')
            }

            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            })

            if (error) {
                throw new BadRequestException(error.message);
            }

            return true


        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }

            throw new BadRequestException(
                error instanceof Error ? error.message : 'Password reset failed',
            );
        }
    }

    // Check user's existance
    async checkUserExistance(email: string) {
        try {
            const userExistance = await this.usersRepository.findOne({ where: { email } })
            return userExistance

        } catch (error) {
            return false
        }
    }

    // Get user from token
    async getUSerFromToken(accessToken: string): Promise<boolean | UserResponse | undefined> {
        try {
            if (!accessToken) return false

            const user: UserResponse = await this.supabase.auth.getUser(accessToken)

            if (!user.data.user) return false

            const userExistance = await this.usersRepository.findOne({ where: { email: user.data.user.email, supabase_id: user.data.user.id } })
            if (!userExistance) return false
            return user
        } catch (error) {
            if (error instanceof InternalServerErrorException) throw new InternalServerErrorException(error.message)
            if (error instanceof BadRequestException) throw new BadRequestException(error.message)

            return false
        }
    }

    async refreshToken(accessToken: string, refreshToken: string) {
        try {
            const userExistance = await this.getUSerFromToken(accessToken)
            if (!userExistance) return false

            const { error, data } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken })

            if (error) return false

            return {
                token: data.session,
                response: {
                    message: 'Refresh successful',
                    data: userExistance
                }
            }

        } catch (error) {
            if (error instanceof InternalServerErrorException) throw new InternalServerErrorException(error.message)
            throw new BadRequestException(error.message)
        }
    }
}