'use client';

import React, { useMemo } from 'react';
import { Check } from 'lucide-react';

interface PasswordStrengthProps {
    password: string;
    variant?: 'compact' | 'detailed';
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
    const rules = useMemo(() => {
        return [
            { id: 'length', label: '8+ ký tự', passed: password.length >= 8 },
            { id: 'number', label: 'Chữ số (0-9)', passed: /[0-9]/.test(password) },
            { id: 'mixed', label: 'Chữ hoa & thường', passed: /[A-Z]/.test(password) && /[a-z]/.test(password) },
            { id: 'special', label: 'Ký tự đặc biệt (@, #, $...)', passed: /[^A-Za-z0-9]/.test(password) },
        ];
    }, [password]);

    const passedCount = rules.filter((r) => r.passed).length;

    const strengthInfo = useMemo(() => {
        if (!password) {
            return {
                text: 'Chưa nhập',
                textColor: 'text-slate-400',
                barColor: 'bg-slate-200',
                percent: 0,
            };
        }
        if (passedCount <= 1) {
            return {
                text: 'Yếu',
                textColor: 'text-rose-600',
                barColor: 'bg-rose-500',
                percent: 25,
            };
        }
        if (passedCount === 2) {
            return {
                text: 'Trung bình',
                textColor: 'text-amber-600',
                barColor: 'bg-amber-500',
                percent: 50,
            };
        }
        if (passedCount === 3) {
            return {
                text: 'Mạnh',
                textColor: 'text-teal-600',
                barColor: 'bg-teal-500',
                percent: 75,
            };
        }
        return {
            text: 'Rất mạnh (4/4)',
            textColor: 'text-emerald-700',
            barColor: 'bg-emerald-600',
            percent: 100,
        };
    }, [password, passedCount]);

    return (
        <div className="w-full space-y-1.5 py-1">
            {/* Hàng chữ gợi ý ở trên */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {rules.map((rule) => {
                        const isPassed = rule.passed;
                        return (
                            <span
                                key={rule.id}
                                className={`inline-flex items-center gap-1 font-medium transition-colors ${
                                    isPassed ? 'text-emerald-700' : 'text-slate-400'
                                }`}
                            >
                                {isPassed ? (
                                    <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600 shrink-0" />
                                ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 inline-block" />
                                )}
                                <span>{rule.label}</span>
                            </span>
                        );
                    })}
                </div>
                {password && (
                    <span className={`text-xs font-bold uppercase tracking-wider shrink-0 ${strengthInfo.textColor}`}>
                        {strengthInfo.text}
                    </span>
                )}
            </div>

            {/* 1 thanh ở dưới */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 rounded-full ${strengthInfo.barColor}`}
                    style={{ width: `${strengthInfo.percent}%` }}
                />
            </div>
        </div>
    );
};
