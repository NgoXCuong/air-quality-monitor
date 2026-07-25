import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
        this.logger.log(`[EMAIL] Sending verification email to: ${email}`);
        this.logger.log(`[EMAIL] Verify URL: ${verifyUrl}`);
    }

    async sendPasswordResetEmail(email: string, token: string): Promise<void> {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
        this.logger.log(`[EMAIL] Sending password reset email to: ${email}`);
        this.logger.log(`[EMAIL] Reset URL: ${resetUrl}`);
    }
}
