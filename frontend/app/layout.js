import './globals.css';

export const metadata = {
  title: 'JH EstimateAI',
  description: 'AI 기반 인테리어/건설 견적 자동화',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
