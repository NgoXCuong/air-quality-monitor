"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckSquare,
  CloudSun,
  Eye,
  EyeOff,
  HeartPulse,
  Info,
  Lock,
  Mail,
  Phone,
  Radio,
  Shield,
  ShieldCheck,
  Square,
  User as UserIcon,
  Users,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export default function RegisterPage() {
  const router = useRouter();

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // AI Personalization priority groups
  const [priorityGroups, setPriorityGroups] = useState<string[]>(["CHILDREN"]);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const togglePriorityGroup = (id: string) => {
    setPriorityGroups((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !email || !password) {
      setErrorMsg("Vui lòng điền đầy đủ các thông tin bắt buộc (*).");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Mật khẩu phải chứa tối thiểu 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg(
        "Bạn vui lòng đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư để tiếp tục.",
      );
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register({
        fullName,
        email,
        password,
        phoneNumber,
        priorityGroups,
      });

      // Chuyển hướng sang trang xác thực email với tham số email
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Đăng ký tài khoản không thành công. Vui lòng kiểm tra lại thông tin!";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start py-4">
      {/* CỘT TRÁI: GIỚI THIỆU HỆ THỐNG GIÁM SÁT HÔ HẤP */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
        {/* Tag chuẩn */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>QCVN 05:2023 CALIBRATED AI</span>
        </div>

        {/* Tiêu đề & Mô tả */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.2]">
            Bảo vệ sức khỏe hệ hô hấp <br />
            gia đình bạn cùng{" "}
            <span className="text-emerald-700">AeroGuard AI</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Nền tảng vi khí hậu thông minh kết hợp mạng lưới cảm biến chuẩn trạm
            khí tượng và AI dự báo chuỗi xung kích bụi mịn hyperlocal.
          </p>
        </div>

        {/* Thẻ trạm Hoàn Kiếm thời gian thực */}
        <Card className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Trạm Hà Nội - Hoàn Kiếm #VN014</span>
            </div>
            <Badge className="bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-[10px] font-bold px-2 py-0.5">
              THỜI GIAN THỰC
            </Badge>
          </div>

          {/* Stats 3 cột */}
          <div className="grid grid-cols-3 gap-2 text-center py-1 bg-slate-50/70 rounded-xl p-2 border border-slate-100">
            <div>
              <p className="text-[10px] font-semibold text-slate-400">AQI MỸ</p>
              <p className="text-xl font-black text-emerald-700">42</p>
              <p className="text-[10px] font-bold text-emerald-600">Tốt</p>
            </div>
            <div className="border-x border-slate-200">
              <p className="text-[10px] font-semibold text-slate-400">PM2.5</p>
              <p className="text-xl font-black text-slate-800">10.2</p>
              <p className="text-[10px] text-slate-500 font-medium">µg/m³</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400">ĐỘ ẨM</p>
              <p className="text-xl font-black text-slate-800">64</p>
              <p className="text-[10px] text-slate-500 font-medium">% RH</p>
            </div>
          </div>

          {/* Trendline wave */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Xu hướng bụi mịn 24h</span>
              <span className="font-bold text-emerald-700">Ổn định</span>
            </div>
            {/* Mini SVG sparkline */}
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 20">
              <path
                d="M0,14 Q25,8 50,12 T100,6"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Card>

        {/* 3 Lợi ích y tế */}
        <div className="space-y-3.5 pt-1">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
              <Radio className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">
                Truy cập 150+ trạm quan trắc quốc gia
              </h2>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dữ liệu vi khí hạt đồng bộ chuẩn Bộ Tài nguyên & Môi trường và
                các trạm vệ tinh độc lập.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
              <HeartPulse className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">
                Khuyến nghị bảo hộ cá nhân hóa y tế
              </h2>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Thuật toán điều chỉnh giờ tập thể dục ngoài trời, chế độ máy lọc
                và khẩu trang theo bệnh sử.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
              <CloudSun className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">
                Dự báo ô nhiễm & thời tiết 7 ngày
              </h2>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mô hình máy học dự báo sự tích tụ nghịch nhiệt và biến động gió
                mùa tại các đô thị lớn.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Badge Nghị định 13 */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
          <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Bảo vệ thông tin người dùng theo Nghị định 13/2023/NĐ-CP</span>
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG KÝ CHI TIẾT */}
      <div className="lg:col-span-7">
        <Card className="w-full bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-6">
          {/* Header Form */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                ĐĂNG KÝ THÀNH VIÊN MỚI
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Khởi tạo hồ sơ giám sát hô hấp
              </h2>
            </div>
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

          {/* Form Đăng ký */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hàng 1: Họ tên + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="fullName"
                  className="text-xs font-bold text-slate-800"
                >
                  Họ và tên *
                </Label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold text-slate-800"
                  >
                    Địa chỉ Email *
                  </Label>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Hàng 2: Số điện thoại di động (kèm tag khẩn cấp) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="phoneNumber"
                  className="text-xs font-bold text-slate-800"
                >
                  Số điện thoại di động *
                </Label>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  📲 SMS/ZALO KHẨN CẤP AQI &gt; 150
                </span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+84 912 345 678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                AeroGuard chỉ nhắn tin cảnh báo khi ô nhiễm không khí rơi vào
                ngưỡng Kém hoặc Nguy hại tại tọa độ của bạn.
              </p>
            </div>

            {/* Hàng 3: Mật khẩu + Xác nhận mật khẩu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold text-slate-800"
                >
                  Mật khẩu *
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiểu 8 ký tự"
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

              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs font-bold text-slate-800"
                >
                  Xác nhận mật khẩu *
                </Label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Đo độ mạnh mật khẩu */}
            <PasswordStrength password={password} variant="compact" />

            {/* Khối Cá nhân hóa AI: 4 nhóm đối tượng ưu tiên */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800">
                  Nhóm đối tượng cần bảo vệ ưu tiên trong gia đình
                </Label>
                <Badge className="bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold px-2 py-0.5">
                  CÁ NHÂN HÓA AI
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                AeroGuard AI sẽ tối ưu ngưỡng cảnh báo và thuật toán khuyến cáo
                y khoa dựa trên lựa chọn của bạn:
              </p>

              {/* Lưới 4 Thẻ Chọn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Card 1: Trẻ nhỏ */}
                <div
                  onClick={() => togglePriorityGroup("CHILDREN")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                    priorityGroups.includes("CHILDREN")
                      ? "bg-emerald-50/60 border-emerald-500 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {priorityGroups.includes("CHILDREN") ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      👶 Gia đình có trẻ nhỏ &lt; 12 tuổi
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Bảo vệ phế quản non nớt trước bụi siêu mịn PM1.0/PM2.5.
                    </p>
                  </div>
                </div>

                {/* Card 2: Hen suyễn */}
                <div
                  onClick={() => togglePriorityGroup("RESPIRATORY")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                    priorityGroups.includes("RESPIRATORY")
                      ? "bg-emerald-50/60 border-emerald-500 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {priorityGroups.includes("RESPIRATORY") ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      🫁 Bệnh hen suyễn / COPD
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Kích hoạt cảnh báo sớm ozone tầng mặt đất &amp; SO2.
                    </p>
                  </div>
                </div>

                {/* Card 3: Người cao tuổi */}
                <div
                  onClick={() => togglePriorityGroup("ELDERLY")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                    priorityGroups.includes("ELDERLY")
                      ? "bg-emerald-50/60 border-emerald-500 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {priorityGroups.includes("ELDERLY") ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      🧓 Người cao tuổi / Tim mạch
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Theo dõi chênh lệch áp suất không khí &amp; nhiệt độ đột
                      ngột.
                    </p>
                  </div>
                </div>

                {/* Card 4: Thể thao ngoài trời */}
                <div
                  onClick={() => togglePriorityGroup("FITNESS")}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                    priorityGroups.includes("FITNESS")
                      ? "bg-emerald-50/60 border-emerald-500 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {priorityGroups.includes("FITNESS") ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      🏃 Chạy bộ &amp; Thể thao ngoài trời
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Lập kế hoạch tập luyện theo khung giờ khí quyển trong sạch
                      nhất.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Điều khoản bằng Shadcn Checkbox */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
              {/* Cụm Checkbox bên trái */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="terms"
                  className="text-xs text-slate-600 leading-snug cursor-pointer select-none"
                >
                  Tôi đồng ý với{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    Điều khoản
                  </Link>{" "}
                  &{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    Chính sách quyền riêng tư
                  </Link>
                </Label>
              </div>

              {/* Link bên phải */}
              <div className="shrink-0 text-xs pl-6 sm:pl-0">
                <span className="text-slate-500">Đã có tài khoản? </span>
                <Link
                  href="/auth/login"
                  className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <span>Đang khởi tạo tài khoản...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Tạo tài khoản AeroGuard AI</span>
                </>
              )}
            </Button>
          </form>

          {/* Hoặc đăng ký nhanh - Đồng bộ 100% với Login */}
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <Separator className="w-full bg-slate-200" />
              <span className="absolute bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                HOẶC ĐĂNG KÝ NHANH
              </span>
            </div>

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
          </div>
        </Card>
      </div>
    </div>
  );
}
