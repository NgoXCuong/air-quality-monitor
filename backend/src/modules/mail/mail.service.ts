// import { Injectable, Logger } from '@nestjs/common';

// @Injectable()
// export class MailService {
//     private readonly logger = new Logger(MailService.name);

//     async sendVerificationEmail(email: string, token: string): Promise<void> {
//         const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
//         this.logger.log(`[EMAIL] Sending verification email to: ${email}`);
//         this.logger.log(`[EMAIL] Verify URL: ${verifyUrl}`);
//     }

//     async sendPasswordResetEmail(email: string, token: string): Promise<void> {
//         const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
//         this.logger.log(`[EMAIL] Sending password reset email to: ${email}`);
//         this.logger.log(`[EMAIL] Reset URL: ${resetUrl}`);
//     }
// }


import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    }

    async sendVerificationEmail(
        email: string,
        token: string,
    ): Promise<void> {
        const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

        try {
            await this.transporter.sendMail({
                from: process.env.MAIL_FROM,
                to: email,
                subject: 'Xác thực tài khoản',
                html: `
                    <h2>Chào bạn!</h2>

                    <p>Cảm ơn bạn đã đăng ký tài khoản.</p>

                    <p>Nhấn vào nút bên dưới để xác thực email:</p>

                    <a href="${verifyUrl}"
                       style="
                            display:inline-block;
                            padding:12px 20px;
                            background:#1976d2;
                            color:white;
                            text-decoration:none;
                            border-radius:6px;">
                        Xác thực Email
                    </a>

                    <p>Hoặc truy cập đường dẫn:</p>

                    <p>${verifyUrl}</p>

                    <p>Liên kết sẽ hết hạn sau 15 phút.</p>
                `,
            });
        } catch (error) {
            throw new InternalServerErrorException(
                'Không thể gửi email xác thực',
            );
        }
    }

    async sendPasswordResetEmail(
        email: string,
        token: string,
    ): Promise<void> {
        const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

        try {
            await this.transporter.sendMail({
                from: process.env.MAIL_FROM,
                to: email,
                subject: 'Đặt lại mật khẩu',
                html: `
                    <h2>Yêu cầu đặt lại mật khẩu</h2>

                    <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>

                    <a href="${resetUrl}"
                       style="
                            display:inline-block;
                            padding:12px 20px;
                            background:#d32f2f;
                            color:white;
                            text-decoration:none;
                            border-radius:6px;">
                        Đặt lại mật khẩu
                    </a>

                    <p>Hoặc truy cập:</p>

                    <p>${resetUrl}</p>

                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
                `,
            });
        } catch (error) {
            throw new InternalServerErrorException(
                'Không thể gửi email đặt lại mật khẩu',
            );
        }
    }
}