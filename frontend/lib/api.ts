import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Gửi cookie cross-origin (HttpOnly refresh token)
});

// Inject access token automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401 (refresh token is sent via HttpOnly cookie automatically)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // Refresh token is sent automatically via cookie (withCredentials: true)
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const { accessToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  },
);

// ────────── Auth API functions ──────────

export const authApi = {
  register: (data: { fullName: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  refresh: () =>
    api.post('/auth/refresh'), // Cookie is sent automatically

  logout: () =>
    api.post('/auth/logout'), // Cookie is sent automatically

  getMe: () =>
    api.get('/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
};
