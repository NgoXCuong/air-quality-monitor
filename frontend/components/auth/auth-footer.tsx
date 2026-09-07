'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export const AuthFooter: React.FC = () => {
    return (
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-200/80 pt-4">
                {/* Security Standards Left */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        QCVN 05:2023/BTNM CALIBRATED
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        256-BIT TLS TELEMETRY SHIELD
                    </span>
                    <span className="hidden md:inline text-slate-300">•</span>
                    <span className="hidden md:inline text-slate-500">
                        © {new Date().getFullYear()} AeroGuard AI Vietnam. All rights reserved.
                    </span>
                </div>

                {/* Legal Links Right */}
                <div className="flex items-center gap-4 text-slate-500 font-medium">
                    <Link href="#" className="hover:text-emerald-700 hover:underline transition-colors">
                        Điều khoản dịch vụ
                    </Link>
                    <span className="text-slate-300">•</span>
                    <Link href="#" className="hover:text-emerald-700 hover:underline transition-colors">
                        Chính sách bảo mật
                    </Link>
                    <span className="text-slate-300">•</span>
                    <Link href="#" className="hover:text-emerald-700 hover:underline transition-colors">
                        Hỗ trợ kỹ thuật
                    </Link>
                </div>
            </div>
        </footer>
    );
};
