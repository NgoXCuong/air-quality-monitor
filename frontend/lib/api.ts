import axios from 'axios';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Gắn Access Token tự động vào Header
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Tự động làm mới Refresh Token nếu nhận lỗi 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
            original._retry = true;
            try {
                const { data } = await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                const { accessToken } = data.data;
                if (accessToken) {
                    localStorage.setItem('accessToken', accessToken);
                    original.headers.Authorization = `Bearer ${accessToken}`;
                    return api(original);
                }
            } catch {
                localStorage.removeItem('accessToken');
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (data: LoginDto) => api.post('/auth/login', data),
    register: (data: RegisterDto) => api.post('/auth/register', {
        name: data.fullName,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
    }),
    forgotPassword: (data: ForgotPasswordDto) => api.post('/auth/forgot-password', data),
    resetPassword: (data: ResetPasswordDto) => api.post('/auth/reset-password', data),
    verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),
    resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
};
