import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import ErrorHandler from '@/components/ErrorHandler';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClaimBot - Internal Claims & Overtime Management",
  description: "Modern expense claims and overtime management system for internal use",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ErrorHandler />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 4000,
                style: {
                  background: '#10b981',
                  color: '#fff',
                },
              },
              error: {
                duration: 6000,
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
