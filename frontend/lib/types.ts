export interface User {
    id: string;
    email: string;
    fullName?: string;
    name?: string;
    phoneNumber?: string;
    phone?: string;
    role: 'USER' | 'ADMIN';
    avatar?: string;
    avatarUrl?: string;
    isVerified: boolean;
    status?: boolean | string;
    createdAt?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        accessToken: string;
    };
}

export interface RegisterDto {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    priorityGroups?: string[];
}

export interface LoginDto {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface ForgotPasswordDto {
    email: string;
}

export interface ResetPasswordDto {
    token: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
}

export interface VerifyEmailDto {
    token?: string;
    otp?: string;
    email?: string;
}
