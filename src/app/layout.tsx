import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sapa Coffee POS",
  description:
    "Hệ thống thu ngân và thống kê bán hàng Sapa Coffee",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="m-0 min-h-screen bg-[#fff5f8]">
        {children}
      </body>
    </html>
  );
}