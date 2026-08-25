import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skylark Command Center - Business Intelligence Dashboard",
  description: "AI-powered business intelligence for Skylark Drones. Real-time pipeline analytics, growth recommendations, and operational insights from Monday.com.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
