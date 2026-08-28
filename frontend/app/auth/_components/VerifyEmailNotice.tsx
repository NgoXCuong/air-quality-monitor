'use client';
import { useState } from 'react';
import { authApi } from '../../../lib/api';

interface Props {
  email: string;
  onResendSuccess: () => void;
  onBack: () => void;
}

export default function VerifyEmailNotice({ email, onResendSuccess, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await authApi.resendVerification(email);
      setSuccess(true);
      onResendSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Không thể gửi lại email. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-notice">
      <div className="verify-icon">📬</div>
      <h2 className="verify-title">Xác thực email của bạn</h2>
      <p className="verify-text">
        Chúng tôi đã gửi email xác thực đến:
      </p>
      <div className="verify-email-badge">{email}</div>
      <p className="verify-text">
        Hãy mở email và nhấn vào link xác thực để kích hoạt tài khoản. Sau đó bạn có thể đăng nhập.
      </p>

      {error && (
        <div className="alert alert-error" style={{ textAlign: 'left' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <span>✅</span>
          <span>Email xác thực đã được gửi lại!</span>
        </div>
      )}

      <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <span>💡</span>
        <span>Không nhận được email? Kiểm tra thư mục spam hoặc gửi lại.</span>
      </div>

      <button
        className="btn-primary"
        onClick={handleResend}
        disabled={loading || success}
      >
        {loading && <span className="btn-spinner" />}
        {loading ? 'Đang gửi...' : success ? '✓ Đã gửi lại' : '🔄 Gửi lại email xác thực'}
      </button>

      <button className="btn-secondary" onClick={onBack}>
        Quay lại đăng nhập
      </button>
    </div>
  );
}
