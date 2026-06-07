import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Load JetBrains Mono from Google Fonts
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Maild - Email Management for Vercel",
  description: "Create and manage email addresses for your Vercel domains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.className} bg-[#0d1117] text-gray-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}