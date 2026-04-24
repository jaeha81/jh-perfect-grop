import './globals.css';

export const metadata = {
  title: 'JH EstimateAI',
  description: '18년 현장 경험 기반 · 5 에이전트 AI 견적 자동화 시스템',
  manifest: '/manifest.json',
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
  themeColor: '#FF6B35',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ background: '#0a0806', color: '#f0ebe6', minHeight: '100svh' }}>
        {children}
      </body>
    </html>
  );
}
