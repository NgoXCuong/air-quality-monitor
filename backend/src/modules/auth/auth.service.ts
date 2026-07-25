import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_BYTES = 40;

function generateToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

function sanitizeUser(user: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    isVerified: boolean;
    avatar: string | null;
    phone: string | null;
    createdAt: Date;
}) {
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        phone: user.phone,
        createdAt: user.createdAt,
    };
}

// ─────────────────────────────────────────────

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
    ) { }

    // ─────────────────────────────────────────
    // PART 1 – Auth Core
    // ─────────────────────────────────────────

    async register(dto: RegisterDto) {
        const existed = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existed) {
            throw new BadRequestException('Email đã tồn tại');
        }

        const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const emailVerifyToken = generateToken();

        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                email: dto.email,
                password: hashedPassword,
                emailVerifyToken,
            },
        });

        // Send verification email (console stub)
        await this.mailService.sendVerificationEmail(user.email, emailVerifyToken);

        return {
            message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
            data: sanitizeUser(user),
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Block unverified users
        if (!user.isVerified) {
            throw new ForbiddenException(
                'Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư.',
            );
        }

        const tokens = await this._issueTokens(user.id, user.email, user.role);

        return {
            message: 'Đăng nhập thành công',
            data: {
                ...tokens,
                user: sanitizeUser(user),
            },
        };
    }

    async refreshToken(dto: RefreshTokenDto) {
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: dto.refreshToken },
            include: { user: true },
        });

        if (!stored || stored.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
        }

        // Rotate: delete old, issue new pair
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });

        const tokens = await this._issueTokens(
            stored.user.id,
            stored.user.email,
            stored.user.role,
        );

        return {
            message: 'Làm mới token thành công',
            data: tokens,
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        return {
            message: 'Lấy thông tin thành công',
            data: sanitizeUser(user),
        };
    }

    async logout(userId: string, refreshToken: string) {
        await this.prisma.refreshToken.deleteMany({
            where: { userId, token: refreshToken },
        });

        return {
            message: 'Đăng xuất thành công',
            data: null,
        };
    }

    // ─────────────────────────────────────────
    // PART 2 – Password Management
    // ─────────────────────────────────────────

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException('Mật khẩu hiện tại không đúng');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Invalidate all refresh tokens for security
        await this.prisma.refreshToken.deleteMany({ where: { userId } });

        return {
            message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
            data: null,
        };
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        // Always return the same message to prevent email enumeration
        const genericMessage = 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.';

        if (!user) {
            return { message: genericMessage, data: null };
        }

        const resetToken = generateToken();
        const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpiry: resetExpiry,
            },
        });

        await this.mailService.sendPasswordResetEmail(user.email, resetToken);

        return { message: genericMessage, data: null };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                passwordResetToken: dto.token,
                passwordResetExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiry: null,
            },
        });

        // Invalidate all sessions after reset
        await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

        return {
            message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
            data: null,
        };
    }

    // ─────────────────────────────────────────
    // PART 3 – Email Verification
    // ─────────────────────────────────────────

    async verifyEmail(token: string) {
        const user = await this.prisma.user.findFirst({
            where: { emailVerifyToken: token },
        });

        if (!user) {
            throw new BadRequestException('Token xác thực không hợp lệ');
        }

        if (user.isVerified) {
            return { message: 'Tài khoản đã được xác thực trước đó', data: null };
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                emailVerifyToken: null,
            },
        });

        return {
            message: 'Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ.',
            data: null,
        };
    }

    async resendVerification(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        // Không tiết lộ email có tồn tại hay không
        if (!user || user.isVerified) {
            return {
                message:
                    'Nếu email hợp lệ và chưa được xác thực, chúng tôi đã gửi email xác thực.',
                data: null,
            };
        }

        const emailVerifyToken = generateToken();

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifyToken,
            },
        });

        await this.mailService.sendVerificationEmail(
            user.email,
            emailVerifyToken,
        );

        return {
            message:
                'Nếu email hợp lệ và chưa được xác thực, chúng tôi đã gửi email xác thực.',
            data: null,
        };
    }

    // ─────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────

    private async _issueTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };

        const accessToken = await this.jwtService.signAsync(payload);

        // Refresh token: plain token stored in DB
        const refreshTokenValue = generateToken();
        const refreshExpiresInDays = parseInt(
            this.configService.get('JWT_REFRESH_EXPIRES_DAYS', '7'),
        );
        const expiresAt = new Date(
            Date.now() + refreshExpiresInDays * 24 * 60 * 60 * 1000,
        );

        await this.prisma.refreshToken.create({
            data: {
                token: refreshTokenValue,
                userId,
                expiresAt,
            },
        });

        return { accessToken, refreshToken: refreshTokenValue };
    }
}