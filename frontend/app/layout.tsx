import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin', 'vietnamese'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'AeroGuard AI - Vietnam Air & Health Intelligence',
    description: 'Hệ thống giám sát chất lượng không khí, vi khí hậu và cảnh báo sức khỏe hô hấp thông minh tại Việt Nam.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" className={`${inter.variable} ${inter.className} h-full antialiased font-sans`}>
            <body className="min-h-full flex flex-col font-sans">{children}</body>
        </html>
    );
}
