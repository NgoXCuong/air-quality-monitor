'use client';

import React, { useRef, useState } from 'react';

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (otp: string) => void;
    disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({ length = 6, value, onChange, disabled }) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const digits = Array.from({ length }, (_, i) => value[i] || '');

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const char = e.target.value.replace(/\D/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = char;
        const newOtp = newDigits.join('');
        onChange(newOtp);

        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
        if (pasted) {
            onChange(pasted);
            const focusIndex = Math.min(pasted.length, length - 1);
            inputRefs.current[focusIndex]?.focus();
        }
    };

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digits[index]}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-extrabold font-mono text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all shadow-xs disabled:bg-slate-100 disabled:opacity-50"
                />
            ))}
        </div>
    );
};
