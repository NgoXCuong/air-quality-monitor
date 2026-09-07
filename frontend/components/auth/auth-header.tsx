'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AuthHeader: React.FC = () => {
    const [lang, setLang] = useState<'VI' | 'EN'>('VI');

    return (
        <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
            {/* Logo AeroGuard AI */}
            <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-95">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                    <Wind className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                            AeroGuard <span className="text-emerald-700">AI</span>
                        </span>
                    </div>
                    <p className="text-[10px] font-bold tracking-widest text-emerald-800/80 uppercase">
                        Vietnam Air & Health AI
                    </p>
                </div>
            </Link>

            {/* Language Switcher & Security Badge */}
            <div className="flex items-center gap-3">
                {/* Language pill */}
                <div className="flex items-center bg-slate-100/90 p-1 rounded-full text-xs font-semibold text-slate-600 border border-slate-200/80 shadow-xs">
                    <button
                        type="button"
                        onClick={() => setLang('VI')}
                        className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            lang === 'VI'
                                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                : 'hover:text-slate-900'
                        }`}
                    >
                        VI
                    </button>
                    <button
                        type="button"
                        onClick={() => setLang('EN')}
                        className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            lang === 'EN'
                                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                : 'hover:text-slate-900'
                        }`}
                    >
                        EN
                    </button>
                </div>

                {/* ISO/IEC 27001 Badge */}
                <Badge
                    variant="outline"
                    className="hidden sm:inline-flex items-center gap-1.5 py-1 px-3 bg-white/80 border-slate-200/90 text-slate-700 font-medium text-xs shadow-xs"
                >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ISO/IEC 27001</span>
                </Badge>
            </div>
        </header>
    );
};
