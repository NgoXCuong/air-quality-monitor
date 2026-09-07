'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    HelpCircle,
    KeyRound,
    Link2,
    Mail,
    Radio,
    Shield,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { OtpInput } from '@/components/auth/otp-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

function VerifyEmailInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const queryToken = searchParams.get('token');
    const queryEmail = searchParams.get('email') || 'lan.nguyen@aeroguard.vn';

    const [otp, setOtp] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(265); // 04:25
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

    // Đồng hồ đếm ngược
    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft]);

    // Tự động kích hoạt nếu người dùng bấm vào link có ?token=...
    useEffect(() => {
        if (queryToken) {
            handleAutoVerifyToken(queryToken);
        }
    }, [queryToken]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAutoVerifyToken = async (token: string) => {
        setIsLoading(true);
        setMessage(null);
        try {
            await authApi.verifyEmail(token);
            setIsVerifiedSuccess(true);
            setMessage({
                type: 'success',
                text: 'Tài khoản của bạn đã được kích hoạt thành công! Đang chuyển hướng sang Đăng nhập...',
            });
            setTimeout(() => router.push('/auth/login'), 2500);
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Mã xác thực token không hợp lệ hoặc đã hết hạn sử dụng.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 6) {
            setMessage({ type: 'error', text: 'Vui lòng nhập đủ 6 chữ số mã OTP.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            await authApi.verifyEmail(otp);
            setIsVerifiedSuccess(true);
            setMessage({
                type: 'success',
                text: 'Kích hoạt tài khoản thành công! Đang chuyển hướng vào hệ thống...',
            });
            setTimeout(() => router.push('/auth/login'), 2000);
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết thời gian hiệu lực.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setIsResending(true);
        setMessage(null);
        try {
            await authApi.resendVerification(queryEmail);
            setSecondsLeft(300); // Đặt lại 5 phút
            setMessage({
                type: 'success',
                text: `Đã gửi lại thư xác thực mới tới địa chỉ ${queryEmail}! Vui lòng kiểm tra hòm thư.`,
            });
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Gửi lại thư thất bại. Vui lòng thử lại sau ít phút.',
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 py-4">
            {/* Top Stepper Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 font-mono font-bold text-slate-600">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>PHIÊN XÁC THỰC BẢO MẬT TLS #AG-7829-VN</span>
                </div>

                <div className="flex items-center gap-2 font-semibold">
                    <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        isVerifiedSuccess
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                        <Mail className="w-3.5 h-3.5" />
                        1. Chờ xác thực
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        isVerifiedSuccess
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'bg-slate-100 text-slate-400'
                    }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        2. Thành công (Token)
                    </span>
                </div>
            </div>

            {/* Sub-bar Status trạm */}
            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium text-center">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hệ sinh thái Quan trắc Khí quyển &amp; Sức khỏe Phổi AeroGuard AI</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700">AQI Hà Nội: <strong className="text-emerald-700">42 (Tốt)</strong></span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700">TP.HCM: <strong className="text-emerald-700">38 (Tốt)</strong></span>
            </div>

            {/* Main Center Card */}
            <Card className="bg-white rounded-3xl border-slate-200 shadow-xl shadow-slate-200/50">
                <CardContent className="p-6 sm:p-10 space-y-6 text-center">
                {/* Glowing OTP Icon */}
                <div className="relative w-20 h-20 mx-auto">
                    <div className="w-20 h-20 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-800/25">
                        <Mail className="w-9 h-9 stroke-[2.2]" />
                    </div>
                    <span className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full bg-teal-500 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        OTP LIVE
                    </span>
                </div>

                {/* Header Tiêu đề */}
                <div className="space-y-2 max-w-lg mx-auto">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                        XÁC NHẬN THÔNG TIN AN TOÀN
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Kiểm tra hòm thư điện tử của bạn
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        Hệ thống vừa gửi liên kết kích hoạt bảo vệ cùng mã OTP số gồm 6 chữ số đến địa chỉ:
                    </p>

                    {/* Email Chip */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100/90 rounded-full border border-slate-200 font-medium text-xs text-slate-800">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold">{queryEmail}</span>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-[10px] font-bold px-1.5 py-0">
                            ISVERIFIED: FALSE
                        </Badge>
                    </div>
                </div>

                {/* Alert Message */}
                {message && (
                    <Alert
                        variant={message.type === 'success' ? 'default' : 'destructive'}
                        className={`max-w-lg mx-auto text-xs py-2.5 ${
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

                {/* 2 Thẻ Phương Thức Kích Hoạt */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <Link2 className="w-4 h-4 text-emerald-700" />
                            <span>Cách 1: Nhấp liên kết</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Mở hộp thư đến và chọn <strong>&ldquo;Kích hoạt tài khoản AeroGuard&rdquo;</strong> để hoàn tất tức thì qua mã token tự động.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <KeyRound className="w-4 h-4 text-teal-700" />
                            <span>Cách 2: Nhập mã OTP</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Sử dụng mã bảo mật 6 số được đính kèm trong thư nếu bạn đang duyệt trên thiết bị khác.
                        </p>
                    </div>
                </div>

                {/* Khung Nhập OTP 6 Ô Số */}
                <form onSubmit={handleConfirmOtp} className="max-w-md mx-auto space-y-4 pt-2">
                    <div className="flex items-center justify-between text-xs px-1">
                        <span className="font-extrabold uppercase tracking-wider text-slate-600 text-[11px]">
                            NHẬP MÃ XÁC THỰC (OTP)
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Mã hết hạn trong:</span>
                            <strong className="text-slate-800 font-mono">{formatTime(secondsLeft)}</strong>
                        </span>
                    </div>

                    {/* 6 Ô nhập OTP */}
                    <OtpInput value={otp} onChange={setOtp} disabled={isLoading || isVerifiedSuccess} />

                    <p className="text-[11px] text-slate-400">
                        Tự động nhảy sang ô kế tiếp khi bạn gõ từng số
                    </p>

                    {/* Nút Xác nhận */}
                    <Button
                        type="submit"
                        disabled={isLoading || isVerifiedSuccess || otp.length < 6}
                        className="w-full h-12 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        {isLoading ? (
                            <span>Đang kiểm tra mã xác thực...</span>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Xác nhận mã kích hoạt</span>
                            </>
                        )}
                    </Button>
                </form>

                {/* Gửi lại email */}
                <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">
                        Chưa thấy thư kích hoạt?{' '}
                        <button
                            type="button"
                            onClick={handleResendEmail}
                            disabled={isResending || secondsLeft > 240}
                            className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer disabled:opacity-50"
                        >
                            {isResending ? 'Đang gửi lại...' : 'Gửi lại email kích hoạt ngay'}
                        </button>
                    </p>
                </div>

                {/* Hộp Trợ Giúp Phía Dưới */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-2xl mx-auto flex items-start gap-3 text-left">
                    <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-800 font-bold">Không nhận được thư xác nhận?</strong>{' '}
                        Hãy kiểm tra hòm thư rác (Spam/Promotions) hoặc đảm bảo tên miền <code className="text-emerald-800 font-mono">@aeroguard.vn</code> không bị tường lửa chặn.{' '}
                        <Link href="#" className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-0.5">
                            Liên hệ hỗ trợ kỹ thuật &gt;
                        </Link>
                    </div>
                </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Đang tải phiên xác thực...</div>}>
            <VerifyEmailInner />
        </Suspense>
    );
}
