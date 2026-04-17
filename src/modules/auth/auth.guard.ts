import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private authService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Get Request
        const request = context.switchToHttp().getRequest()

        const getCoookie = request.headers.cookie

        if (!getCoookie) throw new UnauthorizedException("Session expired, please login again")

        const cookies = getCoookie.split(';').reduce((acc, curr) => {
            const [key, value] = curr.split('=');
            acc[key.trim()] = value;
            return acc;
        }, {});

        let user = await this.authService.getUSerFromToken(cookies.access_token)
        if (!user) {
            const newToken = await this.authService.refreshToken(cookies.access_token, cookies.refresh_token)
            const response = context.switchToHttp().getResponse();

            if (!newToken || !newToken.token) {
                response.clearCookie('access_token', {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                    path: '/',
                });

                response.clearCookie('refresh_token', {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                    path: '/',
                });

                response.status(401).json({
                    message: "Session expired"
                });
                return false
            } else {
                response.cookie('access_token', newToken.token.access_token, 
                    {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                    maxAge: newToken.token.expires_in * 1000
                })
    
                response.cookie('refresh_token', newToken.token.refresh_token,
                    {
                        httpOnly: true,
                        sameSite: 'none',
                        secure: true,
                        maxAge: newToken.token.expires_in * 1000 // Thời gian của accessToken + 1 ngày
                    }
                )
    
                user = await this.authService.getUSerFromToken(newToken.token.access_token)
            }
        }
        request.user = user
        return true
    }

}