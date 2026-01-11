import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { authClient } from '@/lib/auth/client';
import { NeonAuthUIProvider, UserButton } from '@neondatabase/auth/react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "inventRight Design Studio",
  description: "Professional design services for inventors and entrepreneurs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NeonAuthUIProvider
          authClient={authClient}
          redirectTo="/account/settings"
          social={{
            providers: ['google']
          }}
        >
          <header className='flex justify-end items-center p-4 gap-4 h-16'>
            <UserButton size="icon" />
          </header>
          {children}
          <Toaster position="top-right" richColors />
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
