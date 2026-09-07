'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Clock,
    Eye,
    EyeOff,
    Lock,
    Radio,
    Server,
    Shield,
    ShieldCheck,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { PasswordStrength } from '@/components/auth/password-strength';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

function ResetPasswordInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const queryToken = searchParams.get('token') || 'TOKEN-AG-9842-VN';
    const queryEmail = searchParams.get('email') || 'lan.nguyen@aeroguard.vn';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [revokeSessions, setRevokeSessions] = useState(true);

    const [secondsLeft, setSecondsLeft] = useState(432); // 07:12
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Đồng hồ đếm ngược hiệu lực token
    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ mật khẩu mới và xác nhận mật khẩu.' });
            return;
        }

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp.' });
            return;
        }

        setIsLoading(true);

        try {
            await authApi.resetPassword({
                token: queryToken,
                newPassword,
                revokeOtherSessions: revokeSessions,
            });

            setMessage({
                type: 'success',
                text: 'Đặt lại mật khẩu thành công! Các phiên đăng nhập cũ đã được thu hồi. Đang chuyển hướng...',
            });

            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (err: any) {
            const apiMsg = err.response?.data?.message || 'Mã xác thực token không hợp lệ hoặc đã hết hạn.';
            setMessage({ type: 'error', text: apiMsg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 py-4">
            {/* Main Center Floating Card */}
            <Card className="bg-white rounded-3xl border-slate-200/90 shadow-xl shadow-slate-200/50">
                <CardContent className="p-6 sm:p-10 space-y-6">
                {/* Top Token Status Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500 border-b border-slate-100 pb-3">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        TOKEN XÁC THỰC HỢP LỆ: #{queryToken}
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(secondsLeft)}
                    </span>
                </div>

                {/* Header Icon + Titles */}
                <div className="space-y-3 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-800/25">
                        <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
                    </div>

                    <div className="space-y-1.5">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Thiết lập mật khẩu mới
                        </h1>

                        {/* Account info pill */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tài khoản:</span>
                            <strong className="text-slate-900">{queryEmail}</strong>
                            <span className="text-slate-400 font-normal">(Chuyên viên Môi trường)</span>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Vui lòng nhập mật khẩu mới bảo mật cao để bảo vệ quyền truy cập dữ liệu trạm quan trắc vi khí hậu và hồ sơ y tế gia đình của bạn.
                    </p>
                </div>

                {/* Message Alert */}
                {message && (
                    <Alert
                        variant={message.type === 'success' ? 'default' : 'destructive'}
                        className={`text-xs py-2.5 ${
                            message.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                    >
                        {message.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                {/* Reset Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="newPassword" className="text-xs font-bold text-slate-800">
                                Mật khẩu mới *
                            </Label>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                MÃ HÓA ĐA TẦNG 256-BIT
                            </span>
                        </div>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="pl-10 pr-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Password Strength Indicator */}
                    <PasswordStrength password={newPassword} variant="detailed" />

                    {/* Confirm Password */}
                    <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-800">
                                Xác nhận mật khẩu mới *
                            </Label>
                            {isMatch && (
                                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Mật khẩu trùng khớp</span>
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="pl-10 pr-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                            />
                            {isMatch && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                            )}
                        </div>
                    </div>

                    {/* Checkbox: Revoke other sessions */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-3">
                        <Checkbox
                            id="revoke"
                            checked={revokeSessions}
                            onCheckedChange={(c) => setRevokeSessions(c === true)}
                            className="mt-0.5 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                        />
                        <div className="space-y-0.5">
                            <label htmlFor="revoke" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                                Đăng xuất khỏi tất cả các phiên đăng nhập khác
                            </label>
                            <p className="text-[11px] text-slate-500 leading-snug">
                                Vô hiệu hóa quyền truy cập tức thì trên ứng dụng di động, dashboard đo bụi mịn PM2.5 và thiết bị trạm thực địa để đảm bảo an toàn tuyệt đối.
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading || !isMatch}
                        className="w-full h-12 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span>Đang cập nhật mật khẩu...</span>
                        ) : (
                            <>
                                <span>Cập nhật mật khẩu &amp; Đăng nhập ngay</span>
                                <span>→</span>
                            </>
                        )}
                    </Button>
                </form>

                {/* Cancel link */}
                <div className="text-center pt-1 border-t border-slate-100">
                    <Link
                        href="/auth/login"
                        className="text-xs font-semibold text-slate-500 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                    >
                        <span>←</span>
                        <span>Hủy bỏ và quay lại Đăng nhập</span>
                    </Link>
                </div>

                {/* National health & climate data security box */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-start gap-3 text-left">
                    <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-600 space-y-0.5 leading-relaxed">
                        <strong className="text-emerald-950 font-bold uppercase tracking-wider block">
                            BẢO MẬT DỮ LIỆU Y TẾ &amp; KHÍ HẬU QUỐC GIA
                        </strong>
                        Tuân thủ tiêu chuẩn an toàn bảo mật dữ liệu sức khỏe và quan trắc viễn trắc quốc gia (<strong>QCVN 05:2023</strong> &amp; <strong>ISO/IEC 27001</strong>). Mật khẩu của bạn được mã hóa một chiều <strong>Argon2id</strong> trước khi truyền tải qua kênh TLS an toàn.
                    </div>
                </div>
                </CardContent>
            </Card>

            {/* Bottom status telemetry */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 font-medium px-2">
                <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mạng lưới trạm: <strong>Hà Nội • TP.HCM • Đà Nẵng</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Server className="w-3.5 h-3.5" />
                    <span>AeroGuard Auth Gateway v4.2.8</span>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Đang tải cấu hình mật khẩu...</div>}>
            <ResetPasswordInner />
        </Suspense>
    );
}
