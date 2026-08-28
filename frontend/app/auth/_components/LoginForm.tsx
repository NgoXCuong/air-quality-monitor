'use client';
import { useState } from 'react';
import { authApi } from '../../../lib/api';

interface Props {
  onSuccess: (data: { accessToken: string; refreshToken: string; user: unknown }) => void;
  onSwitch: () => void;
  onForgotPassword: () => void;
}

export default function LoginForm({ onSuccess, onSwitch, onForgotPassword }: Props) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Vui lòng nhập email';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    setIsForbidden(false);
    try {
      const res = await authApi.login(form);
      const { accessToken, user } = res.data.data;
      // Refresh token is now stored as HttpOnly cookie by backend
      localStorage.setItem('accessToken', accessToken);
      onSuccess({ accessToken, refreshToken: '', user });
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string }; status?: number } })?.response;
      const status = errData?.status;
      const msg = errData?.data?.message;
      if (status === 403) {
        setIsForbidden(true);
        setApiError(msg || 'Tài khoản chưa được xác thực email.');
      } else {
        setApiError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Đăng nhập thất bại.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {apiError && (
        <div className={`alert ${isForbidden ? 'alert-warning' : 'alert-error'}`}>
          <span>{isForbidden ? '📧' : '⚠️'}</span>
          <span>
            {apiError}
            {isForbidden && (
              <> Vui lòng kiểm tra hộp thư của bạn.</>
            )}
          </span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Email</label>
        <div className="form-input-wrapper">
          <span className="form-input-icon">✉️</span>
          <input
            className="form-input"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
        </div>
        {errors.email && <p className="form-error">⚠ {errors.email}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Mật khẩu</label>
        <div className="form-input-wrapper">
          <span className="form-input-icon">🔒</span>
          <input
            className="form-input"
            type={showPw ? 'text' : 'password'}
            placeholder="Nhập mật khẩu"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />
          <button type="button" className="form-input-eye" onClick={() => setShowPw(!showPw)}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.password && <p className="form-error">⚠ {errors.password}</p>}
        <button type="button" className="form-forgot" onClick={onForgotPassword}>
          Quên mật khẩu?
        </button>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading && <span className="btn-spinner" />}
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>

      <button type="button" className="btn-secondary" onClick={onSwitch}>
        Chưa có tài khoản? Đăng ký ngay
      </button>
    </form>
  );
}
