'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    AlertCircle,
    CheckCircle2,
    HardDrive,
    HelpCircle,
    KeyRound,
    Lock,
    Mail,
    Radio,
    Shield,
    ShieldAlert,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ email tài khoản của bạn.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            await authApi.forgotPassword({ email });
            setMessage({
                type: 'success',
                text: `Liên kết khôi phục mật khẩu bảo mật đã được gửi đến hòm thư ${email}. Vui lòng kiểm tra email của bạn!`,
            });
        } catch (err: any) {
            const apiMsg = err.response?.data?.message || 'Không thể gửi email khôi phục. Vui lòng thử lại!';
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
                {/* Top Security Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500 border-b border-slate-100 pb-3">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        KHÔI PHỤC QUYỀN TRUY CẬP HỆ THỐNG • PHIÊN BẢO MẬT TLS 1.3
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                        <Lock className="w-3 h-3 text-slate-400" />
                        QCVN 05:2023
                    </span>
                </div>

                {/* Header Icon + Titles */}
                <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
                        <KeyRound className="w-7 h-7 stroke-[2.2]" />
                    </div>

                    <div className="space-y-1">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                            Cơ sở dữ liệu trạm quan trắc quốc gia
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Quên mật khẩu truy cập?
                        </h1>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Nhập địa chỉ email đã đăng ký tài khoản <strong>AeroGuard AI</strong> của bạn. Hệ thống máy chủ cảnh báo môi trường sẽ gửi liên kết khôi phục an toàn kèm mã xác thực <code className="text-emerald-800 font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">passwordResetToken</code> có hiệu lực trong <strong>15 phút</strong>.
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

                {/* Form Quên mật khẩu */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email" className="text-xs font-bold text-slate-800">
                                Địa chỉ Email liên kết tài khoản *
                            </Label>
                            <span className="text-[11px] font-semibold text-emerald-700">
                                ● Cần định danh
                            </span>
                        </div>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com hoặc dr.lan@aeroguard.vn"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-10 pr-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                            />
                            <HelpCircle className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span>ⓘ</span> Chúng tôi sẽ gửi liên kết tạo mật khẩu mới trực tiếp đến hòm thư này.
                        </p>
                    </div>

                    {/* Security Notice Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5 text-left">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Hệ thống bảo vệ dữ liệu trạm quan trắc &amp; hồ sơ sức khỏe</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Để chống tấn công từ điển và dò quét tài khoản vi khí hậu, yêu cầu gửi liên kết chỉ được thực hiện tối đa <strong>3 lần/giờ</strong> cho mỗi địa chỉ email. Mọi lượt yêu cầu được gắn thẻ ký số SHA-256 kèm địa chỉ IP trạm.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        {isLoading ? (
                            <span>Đang mã hóa &amp; gửi yêu cầu...</span>
                        ) : (
                            <>
                                <span>Gửi liên kết khôi phục mật khẩu</span>
                                <Mail className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </form>

                {/* Nav Links */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
                    <Link
                        href="/auth/login"
                        className="font-bold text-slate-700 hover:text-emerald-800 flex items-center gap-1.5"
                    >
                        <span>←</span>
                        <span>Nhớ lại mật khẩu? Quay lại Đăng nhập</span>
                    </Link>

                    <Link
                        href="#"
                        className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Hỗ trợ chuyên gia Bộ TN&amp;MT / Quản trị trạm</span>
                    </Link>
                </div>
                </CardContent>
            </Card>

            {/* Bottom Help Notice */}
            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="leading-relaxed">
                    <strong className="text-slate-800 font-bold">Bạn không còn quyền truy cập vào email này?</strong>{' '}
                    Hãy liên hệ bộ phận hỗ trợ kỹ thuật viên giám sát môi trường qua đường dây nóng trung tâm điều hành hoặc xác thực lại hồ sơ thẻ chuyên viên tại trung tâm dữ liệu vùng để thực hiện quy trình định danh khẩn cấp.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] font-medium text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Gateway Hà Nội: Sẵn sàng
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Gateway TP. Hồ Chí Minh: Trực tuyến
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-teal-800">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        Đà Nẵng Sensor Mesh: Ổn định
                    </span>
                </div>
            </div>
        </div>
    );
}
