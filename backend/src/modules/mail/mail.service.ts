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

    async sendAqiAlertEmail(
        email: string,
        data: {
            locationName: string;
            aqi: number;
            pm25: number;
            level: string;
            color: string;
            advice: string;
        },
    ): Promise<void> {
        const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}`;

        try {
            await this.transporter.sendMail({
                from: process.env.MAIL_FROM,
                to: email,
                subject: `⚠️ Cảnh báo ô nhiễm không khí tại ${data.locationName}: AQI ${data.aqi}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <div style="background-color: #0f172a; padding: 20px; text-align: center; color: white;">
                            <h2 style="margin: 0; font-size: 20px;">AeroHealth — Cảnh Báo Chất Lượng Không Khí</h2>
                        </div>
                        <div style="padding: 24px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <span style="display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; background-color: ${data.color}20; color: ${data.color}; border: 1px solid ${data.color};">
                                    ${data.level} (AQI ${data.aqi})
                                </span>
                            </div>

                            <p style="font-size: 16px; color: #1e293b; line-height: 1.5;">
                                Xin chào bạn! Hệ thống quan trắc vừa ghi nhận chất lượng không khí tại <strong>${data.locationName}</strong> đã vượt ngưỡng an toàn.
                            </p>

                            <div style="background-color: #f8fafc; border-left: 4px solid ${data.color}; padding: 16px; border-radius: 6px; margin: 20px 0;">
                                <p style="margin: 0 0 8px 0; font-weight: bold; color: #0f172a;">Chi tiết quan trắc:</p>
                                <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px;">
                                    <li>Chỉ số ô nhiễm AQI: <strong>${data.aqi}</strong></li>
                                    <li>Nồng độ bụi mịn PM2.5: <strong>${data.pm25} µg/m³</strong></li>
                                    <li>Thời điểm ghi nhận: <strong>${new Date().toLocaleString('vi-VN')}</strong></li>
                                </ul>
                            </div>

                            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0 0 6px 0; font-weight: bold; color: #92400e;">Lời khuyên y tế tức thì:</p>
                                <p style="margin: 0; color: #b45309; font-size: 14px; line-height: 1.5;">${data.advice}</p>
                            </div>

                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px;">
                                    Xem Biểu Đồ & Dự Báo 24 Giờ Tiếp Theo
                                </a>
                            </div>
                        </div>
                        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
                            AeroHealth © 2026 — Đồ Án Tốt Nghiệp Giám Sát Không Khí & Cảnh Báo Sức Khỏe AI
                        </div>
                    </div>
                `,
            });
        } catch (error) {
            console.error('Không thể gửi email cảnh báo AQI:', error?.message);
        }
    }
}