'use client';
import { useState } from 'react';
import { authApi } from '../../../lib/api';

interface Props {
  onSuccess: (email: string) => void;
  onSwitch: () => void;
}

function getPasswordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  return { score, label: labels[score] || '' };
}

export default function RegisterForm({ onSuccess, onSwitch }: Props) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!form.email) e.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await authApi.register(form);
      onSuccess(form.email);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['', 'active-weak', 'active-medium', 'active-strong', 'active-strong'];

  return (
    <form onSubmit={handleSubmit} noValidate>
      {apiError && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{apiError}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Họ và tên</label>
        <div className="form-input-wrapper">
          <span className="form-input-icon">👤</span>
          <input
            className="form-input"
            type="text"
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>
        {errors.fullName && <p className="form-error">⚠ {errors.fullName}</p>}
      </div>

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
            placeholder="Tối thiểu 6 ký tự"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="button" className="form-input-eye" onClick={() => setShowPw(!showPw)}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
        {form.password && (
          <div className="password-strength">
            <div className="strength-bars">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`strength-bar ${i <= strength.score ? strengthColors[strength.score] : ''}`}
                />
              ))}
            </div>
            <span className="strength-label">
              Độ mạnh: <strong>{strength.label}</strong>
            </span>
          </div>
        )}
        {errors.password && <p className="form-error">⚠ {errors.password}</p>}
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading && <span className="btn-spinner" />}
        {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
      </button>

      <button type="button" className="btn-secondary" onClick={onSwitch}>
        Đã có tài khoản? Đăng nhập
      </button>
    </form>
  );
}
