import '@/styles/globals.css';
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};
export const metadata = {
  title: 'Baldur Creek Capital',
  description: 'Multi-Agent Trading System Dashboard',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Baldur Creek',
  },
  themeColor: '#0A1628',
};
export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-navy-deep text-ice-white font-inter min-h-screen">
        {children}
      </body>
    </html>
  );
}
