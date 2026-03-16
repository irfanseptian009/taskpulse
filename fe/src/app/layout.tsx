import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MainLayout } from '@/components/layout/MainLayout';
import { Toaster } from '@/components/ui/sonner';

const font = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'TaskPulse | Webhook Scheduler',
  description: 'Schedule and manage Discord webhook tasks with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} min-h-screen bg-background antialiased selection:bg-primary/30 selection:text-primary overflow-hidden`}>
        <Providers>
          <div className="flex h-screen bg-muted/10 dark:bg-background">
            <AppSidebar />
            <MainLayout>
              {children}
            </MainLayout>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
