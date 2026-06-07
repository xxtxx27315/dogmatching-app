import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "ドッグLIFE - 犬のSNSマッチングアプリ",
  description: "愛犬の友達を作ろう。犬同士でつながるマッチングアプリ。",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ドッグLIFE" },
  formatDetection: { telephone: false },
  openGraph: { type: "website", title: "ドッグLIFE", description: "愛犬の友達を作ろう。" },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
