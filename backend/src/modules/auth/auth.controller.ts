import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import {
  ForgotPasswordDto,
  GoogleCompleteDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { confirmPassword: _, ...registerData } = dto;
    const result = await this.authService.register(registerData);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Redirect handled by Passport
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const session = this.authService.issueSession(req.user as any);
    const code = this.authService.createGoogleExchangeCode(session.user.id);
    const frontend = this.config.get<string>('app.frontendUrl', 'http://localhost:3001');
    res.redirect(
      `${frontend}/auth/google/callback?code=${encodeURIComponent(code)}`,
    );
  }

  @Public()
  @Post('google/complete')
  @HttpCode(HttpStatus.OK)
  async googleComplete(
    @Body() dto: GoogleCompleteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.completeGoogleExchange(dto.code);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token;
    if (!token) {
      throw new UnauthorizedException('Refresh token required');
    }
    const result = await this.authService.refresh(token);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearTokenCookies(res);
    return { message: 'Logged out successfully' };
  }

  private isProduction() {
    return this.config.get<string>('app.nodeEnv') === 'production';
  }

  private cookieOptions(maxAge: number) {
    const production = this.isProduction();
    return {
      httpOnly: true,
      secure: production,
      sameSite: (production ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
      maxAge,
    };
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, this.cookieOptions(15 * 60 * 1000));
    res.cookie('refresh_token', refreshToken, this.cookieOptions(7 * 24 * 60 * 60 * 1000));
  }

  private clearTokenCookies(res: Response) {
    const production = this.isProduction();
    const opts = {
      path: '/',
      httpOnly: true,
      secure: production,
      sameSite: (production ? 'none' : 'lax') as 'none' | 'lax',
    };
    res.clearCookie('access_token', opts);
    res.clearCookie('refresh_token', opts);
  }
}
