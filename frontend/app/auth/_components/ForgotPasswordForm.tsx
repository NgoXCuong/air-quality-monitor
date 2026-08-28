'use client';
import { useState } from 'react';
import { authApi } from '../../../lib/api';

interface Props {
  onBack: () => void;
}

type Step = 'email' | 'sent';

export default function ForgotPasswordForm({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setStep('sent');
    } catch {
      // Always show success (anti-enumeration)
      setStep('sent');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'sent') {
    return (
      <div className="success-screen">
        <div className="success-icon">📧</div>
        <h2 className="form-title">Kiểm tra email!</h2>
        <p className="form-subtitle" style={{ marginBottom: '1.5rem' }}>
          Nếu email <strong style={{ color: 'var(--accent-blue-light)' }}>{email}</strong> đã được
          đăng ký, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút.
        </p>
        <div className="alert alert-info">
          <span>💡</span>
          <span>Hãy kiểm tra cả thư mục spam nếu không thấy email.</span>
        </div>
        <button className="btn-primary" onClick={onBack}>
          Quay lại đăng nhập
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <button type="button" className="btn-back" onClick={onBack}>
        ← Quay lại
      </button>

      <h2 className="form-title">Quên mật khẩu?</h2>
      <p className="form-subtitle">
        Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
      </p>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
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
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            autoFocus
          />
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading && <span className="btn-spinner" />}
        {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
      </button>
    </form>
  );
}
