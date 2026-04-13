import './globals.css';

export const metadata = {
  title: 'JH EstimateAI',
  description: '18년 현장 경험 기반 · 5 에이전트 AI 견적 자동화 시스템',
  manifest: '/manifest.json',
  themeColor: '#7c6af7',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JH EstimateAI',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport = {
  themeColor: '#7c6af7',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
