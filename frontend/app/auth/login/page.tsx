"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Radio,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ địa chỉ Email và Mật khẩu.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await authApi.login({ email, password });
      const { accessToken, user } = res.data.data;

      if (accessToken) {
        if (rememberMe) {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("currentUser", JSON.stringify(user));
        } else {
          sessionStorage.setItem("accessToken", accessToken);
          sessionStorage.setItem("currentUser", JSON.stringify(user));
          localStorage.removeItem("accessToken");
          localStorage.removeItem("currentUser");
        }
        router.push("/");
      }
    } catch (err: any) {
      const apiMsg = err.response?.data?.message;
      if (err.response?.status === 403 && apiMsg?.includes("xác thực")) {
        setErrorMsg(
          "Tài khoản của bạn chưa được kích hoạt qua email. Vui lòng kiểm tra hộp thư đến hoặc nhấn liên kết xác thực.",
        );
      } else {
        setErrorMsg(
          apiMsg || "Email hoặc mật khẩu không chính xác. Vui lòng thử lại!",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* CỘT TRÁI: HỆ SINH THÁI THÔNG TIN KHÍ HẬU */}
      <div className="lg:col-span-6 space-y-6">
        {/* Tag chuẩn kiểm định */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>QCVN 05:2023/BTNM VERIFIED</span>
        </div>

        {/* Tiêu đề & Mô tả */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Hệ sinh thái quan trắc <br />
            <span className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-600 bg-clip-text text-transparent">
              vi khí hậu chuẩn xác
            </span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Mạng lưới cảm biến môi trường IoT mật độ cao, tích hợp thuật toán AI
            dự báo biến động AQI và khuyến nghị phơi nhiễm độc quyền cho Việt
            Nam.
          </p>
        </div>

        {/* Grid 2 Card Thông Số AI & Phủ Sóng */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>MÔ HÌNH AI</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              R² = 0.94
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Độ tin cậy dự báo 24h
            </p>
          </Card>

          <Card className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>PHỦ SÓNG</span>
              <Radio className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              63/63
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Tỉnh thành kết nối
            </p>
          </Card>
        </div>

        {/* Danh sách tính năng cốt lõi */}
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Cảnh báo tức thời siêu cục bộ
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Phát hiện nghịch nhiệt tầng thấp và đợt tăng vọt bụi mịn PM2.5
                theo từng bán kính 500m.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Trợ lý bảo vệ phế quản gia đình
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Lập lộ trình di chuyển sạch và lịch bật máy lọc không khí tự
                động qua AI Agent.
              </p>
            </div>
          </div>
        </div>

        {/* Thẻ trạm đo thời gian thực Ba Đình */}
        <Card className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border border-emerald-200/70 shadow-xs flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Hà Nội – Trạm Ba Đình</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-950">38</span>
              <span className="text-xs font-semibold text-emerald-800">
                US-AQI
              </span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-0.5">
              TỐT / GOOD
            </Badge>
            <p className="text-[11px] text-slate-600 font-medium">
              PM2.5: <strong>9.2 µg/m³</strong> • RH: <strong>68%</strong>
            </p>
          </div>
        </Card>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP SHADCN */}
      <div className="lg:col-span-6">
        <Card className="w-full bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-6">
          {/* Header Form */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
              CỔNG TRUY CẬP CHUYÊN GIA & NGƯỜI DÙNG
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Chào mừng trở lại!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Đăng nhập để theo dõi trạm quan trắc và nhận khuyến nghị sức khỏe
              tức thời từ AI.
            </p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium text-xs flex items-center justify-center gap-2 rounded-xl shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Tài khoản Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium text-xs flex items-center justify-center gap-2 rounded-xl shadow-2xs cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Cổng SSO Bộ TN&MT</span>
            </Button>
          </div>

          {/* Divider bằng Separator */}
          <div className="relative flex items-center justify-center">
            <Separator className="w-full bg-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              HOẶC EMAIL TÀI KHOẢN
            </span>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <Alert
              variant="destructive"
              className="bg-rose-50 border-rose-200 text-rose-800 text-xs py-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold text-slate-800"
                >
                  Địa chỉ Email
                </Label>
                <span className="text-[11px] font-medium text-slate-400">
                  Định danh SSO / Cá nhân
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="dr.lan@aeroguard.vn hoặc name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-bold text-slate-800"
              >
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Hàng bên dưới input mật khẩu: Ghi nhớ đăng nhập & Quên mật khẩu */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor="remember"
                  className="text-xs font-medium text-slate-600 cursor-pointer select-none"
                >
                  Ghi nhớ đăng nhập
                </Label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <span>Đang xác thực bảo mật...</span>
              ) : (
                <>
                  <span>Đăng nhập vào hệ thống</span>
                  <span>→</span>
                </>
              )}
            </Button>
          </form>

          {/* Switch to Register link */}
          <div className="text-center pt-1">
            <p className="text-xs text-slate-500">
              Chưa có tài khoản AeroGuard?{" "}
              <Link
                href="/auth/register"
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
