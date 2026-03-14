import { Inter, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-display', weight: ['400', '500', '600', '700', '800'] });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata = {
  title: { default: 'Smart Campus', template: '%s | Smart Campus' },
  description: 'Modern college management platform for students, faculty and administrators.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
