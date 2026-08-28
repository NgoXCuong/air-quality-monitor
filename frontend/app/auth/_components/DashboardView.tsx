'use client';
import { useState, useEffect } from 'react';
import { authApi } from '../../../lib/api';

interface Props {
  onSuccess: () => void;
}

export default function DashboardView({ onSuccess: onLogout }: Props) {
  const [user, setUser] = useState<{ fullName?: string; email?: string; role?: string; isVerified?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  // Change password state
  const [cpForm, setCpForm] = useState({ currentPassword: '', newPassword: '' });
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [showCp, setShowCp] = useState(false);

  useEffect(() => {
    authApi.getMe()
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        onLogout();
      })
      .finally(() => setLoading(false));
  }, [onLogout]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    try { await authApi.logout(refreshToken); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    onLogout();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpForm.currentPassword || !cpForm.newPassword) {
      setCpError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (cpForm.newPassword.length < 6) {
      setCpError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setCpLoading(true); setCpError(''); setCpSuccess('');
    try {
      await authApi.changePassword(cpForm);
      setCpSuccess('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      setCpForm({ currentPassword: '', newPassword: '' });
      setTimeout(() => handleLogout(), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCpError(msg || 'Đổi mật khẩu thất bại');
    } finally {
      setCpLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="btn-spinner" style={{ display: 'inline-block', width: 40, height: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)', borderTopColor: '#3b82f6' }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 className="form-title" style={{ marginBottom: '0.25rem' }}>
            Xin chào, {user?.fullName || 'Bạn'} 👋
          </h2>
          <p className="form-subtitle" style={{ marginBottom: 0 }}>Bạn đã đăng nhập thành công</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1.25rem', marginTop: 0 }}>
          🚪 Đăng xuất
        </button>
      </div>

      {/* User Info Card */}
      <div style={{
        background: 'rgba(59,130,246,0.06)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 14,
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {[
            { label: '📧 Email', value: user?.email },
            { label: '🛡️ Vai trò', value: user?.role === 'ADMIN' ? '👑 Quản trị viên' : '👤 Người dùng' },
            { label: '✅ Trạng thái', value: user?.isVerified ? '✓ Đã xác thực' : '⚠ Chưa xác thực' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password toggle */}
      <button
        className="btn-secondary"
        style={{ marginTop: 0, marginBottom: showCp ? '1rem' : 0 }}
        onClick={() => { setShowCp(!showCp); setCpError(''); setCpSuccess(''); }}
      >
        🔑 {showCp ? 'Ẩn đổi mật khẩu' : 'Đổi mật khẩu'}
      </button>

      {showCp && (
        <form onSubmit={handleChangePassword} noValidate>
          {cpError && <div className="alert alert-error" style={{ marginTop: '1rem' }}><span>⚠️</span><span>{cpError}</span></div>}
          {cpSuccess && <div className="alert alert-success" style={{ marginTop: '1rem' }}><span>✅</span><span>{cpSuccess}</span></div>}

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Mật khẩu hiện tại</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">🔒</span>
              <input className="form-input" type="password" placeholder="Nhập mật khẩu hiện tại"
                value={cpForm.currentPassword} onChange={(e) => setCpForm({ ...cpForm, currentPassword: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu mới</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">🔑</span>
              <input className="form-input" type="password" placeholder="Nhập mật khẩu mới"
                value={cpForm.newPassword} onChange={(e) => setCpForm({ ...cpForm, newPassword: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={cpLoading}>
            {cpLoading && <span className="btn-spinner" />}
            {cpLoading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
          </button>
        </form>
      )}
    </div>
  );
}
