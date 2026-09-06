import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { ResendVerificationDto } from './dto/resend.verification.dto';

// Cookie configuration constants
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: maxAgeMs,
});

@ApiTags('Auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─────────────────────────────────────────
  // PART 1 – Auth Core
  // ─────────────────────────────────────────
  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Đăng nhập và nhận access + refresh token' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(dto);

    // Set refresh token as HttpOnly cookie
    const { refreshToken, ...responseData } = result.data;
    const maxAgeMs = this.authService.getRefreshTokenMaxAgeMs();
    res.cookie(
      REFRESH_COOKIE_NAME,
      refreshToken,
      REFRESH_COOKIE_OPTIONS(maxAgeMs),
    );

    return {
      message: result.message,
      data: responseData,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token (cookie)' })
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không tồn tại');
    }

    const result = await this.authService.refreshToken({ refreshToken });

    // Set new refresh token cookie (rotation)
    const maxAgeMs = this.authService.getRefreshTokenMaxAgeMs();
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.data.refreshToken,
      REFRESH_COOKIE_OPTIONS(maxAgeMs),
    );

    return {
      message: result.message,
      data: { accessToken: result.data.accessToken },
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng đang đăng nhập' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất (xóa refresh token)' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || '';
    const result = await this.authService.logout(user.sub, refreshToken);

    // Clear cookie
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });

    return result;
  }

  // ─────────────────────────────────────────
  // PART 2 – Password Management
  // ─────────────────────────────────────────

  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu (yêu cầu đăng nhập)' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.changePassword(user.sub, dto);

    // Clear refresh cookie since all sessions are invalidated
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });

    return result;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu (gửi link qua email)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng token từ email' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─────────────────────────────────────────
  // PART 3 – Email Verification
  // ─────────────────────────────────────────

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Xác thực email bằng token từ link' })
  @ApiQuery({ name: 'token', description: 'Token xác thực email' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Gửi lại email xác thực' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }
}
