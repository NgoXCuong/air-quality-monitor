'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { authApi } from '../../../lib/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError('Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu lại.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.newPassword || form.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ token, newPassword: form.newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Token không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-right" style={{ width: '100%' }}>
        <div className="auth-card" style={{ maxWidth: 440 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            }}>🌬️</div>
            <span style={{
              fontWeight: 700, fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>AirQuality Monitor</span>
          </div>

          {success ? (
            <div className="success-screen">
              <div className="success-icon">✅</div>
              <h2 className="verify-title">Đặt lại mật khẩu thành công!</h2>
              <p className="verify-text">Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.</p>
              <a href="/auth">
                <button className="btn-primary">Đăng nhập ngay</button>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="form-title">Đặt lại mật khẩu</h2>
              <p className="form-subtitle" style={{ marginBottom: '1.5rem' }}>
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>

              {error && (
                <div className="alert alert-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">🔒</span>
                  <input
                    className="form-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={form.newPassword}
                    onChange={(e) => { setForm({ ...form, newPassword: e.target.value }); setError(''); }}
                  />
                  <button type="button" className="form-input-eye" onClick={() => setShowPw(!showPw)}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">🔑</span>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={form.confirm}
                    onChange={(e) => { setForm({ ...form, confirm: e.target.value }); setError(''); }}
                  />
                </div>
                {form.confirm && form.newPassword !== form.confirm && (
                  <p className="form-error">⚠ Mật khẩu không khớp</p>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={loading || !token}>
                {loading && <span className="btn-spinner" />}
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </button>

              <a href="/auth">
                <button type="button" className="btn-secondary">Quay lại đăng nhập</button>
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0f1e' }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
